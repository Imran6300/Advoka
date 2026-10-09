import { inngest } from "@/inngest/client";
import { downloadDocumentBuffer } from "@/lib/storage/supabase";
import { extractPdfPages, type ExtractedPage } from "@/lib/extraction/pdf";
import { extractDocxPages } from "@/lib/extraction/docx";
import { extractImageText } from "@/lib/extraction/ocr";
import { chunkPages } from "@/lib/extraction/chunk";
import { embedTexts, embeddingStepSize } from "@/lib/ai/embeddings";
import {
  getDocumentByEventRef,
  markDocumentExtracting,
  markDocumentExtracted,
  markDocumentFailed,
  deleteChunksForDocument,
  upsertDocumentChunks,
  recalculateCaseDocumentStats,
} from "@/lib/db/queries/documents";

const PDF_TYPES = new Set(["application/pdf"]);
const DOCX_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/tiff"]);

/** Embedding batches that run at the same time (each is its own short serverless call). */
const EMBED_WAVE = 3;

interface ExtractionOutcome {
  pages: ExtractedPage[];
  failureReason?: string;
}

export const documentProcessing = inngest.createFunction(
  {
    id: "document-processing",
    name: "Document Processing",
    concurrency: { limit: 5 },
    // Default is 4 retries; a step that times out would otherwise re-run for
    // minutes before the user sees anything.
    retries: 2,
    // Without this, a run that exhausts its retries left the document in
    // "extracting" forever (UI spins and polls indefinitely).
    onFailure: async ({ event }) => {
      const original = (event.data.event?.data ?? {}) as { documentId?: string; caseId?: string };
      if (!original.documentId) return;
      await markDocumentFailed(
        original.documentId,
        "Processing didn't finish. Please try again — if it keeps failing, the file may be too large or damaged."
      );
      if (original.caseId) await recalculateCaseDocumentStats(original.caseId);
    },
  },
  { event: "document.uploaded" },
  async ({ event, step }) => {
    const { documentId, caseId, ownerId } = event.data;

    // load + mark-extracting merged: one Inngest round trip instead of two.
    const doc = await step.run("prepare", async () => {
      const record = await getDocumentByEventRef({ documentId, caseId, ownerId });
      if (!record) throw new Error(`Document ${documentId} not found for case ${caseId}`);
      await markDocumentExtracting(documentId);
      return {
        mimeType: record.mimeType as string,
        storageUrl: record.storageUrl as string,
        originalFilename: record.originalFilename as string,
      };
    });

    // The buffer never crosses a step boundary (Inngest persists step results
    // as JSON) — only the extracted text does.
    const extraction = await step.run("extract-text", async (): Promise<ExtractionOutcome> => {
      const t0 = Date.now();
      const buffer = await downloadDocumentBuffer(doc.storageUrl);
      const tDownload = Date.now() - t0;

      let outcome: ExtractionOutcome;
      if (PDF_TYPES.has(doc.mimeType)) {
        const result = await extractPdfPages(buffer);
        outcome = result.looksScanned
          ? {
              pages: [],
              failureReason:
                "This PDF appears to be scanned or image-only. OCR for scanned PDFs isn't supported yet — try re-uploading the pages as images instead.",
            }
          : { pages: result.pages };
      } else if (DOCX_TYPES.has(doc.mimeType)) {
        outcome = { pages: (await extractDocxPages(buffer)).pages };
      } else if (IMAGE_TYPES.has(doc.mimeType)) {
        outcome = { pages: (await extractImageText(buffer)).pages };
      } else {
        outcome = {
          pages: [],
          failureReason: `Unsupported file type (${doc.mimeType}). Advoka currently supports PDF, DOCX, and common image formats.`,
        };
      }

      // Re-processing (Try Again) replaces chunks instead of duplicating them.
      if (outcome.pages.length > 0) await deleteChunksForDocument(documentId);

      console.log(
        `[doc-processing] extract-text "${doc.originalFilename}" pages=${outcome.pages.length} download=${tDownload}ms total=${Date.now() - t0}ms`
      );
      return outcome;
    });

    const usablePages = extraction.pages.filter((p) => p.text.trim().length > 0);

    if (extraction.failureReason || usablePages.length === 0) {
      await step.run("mark-failed", async () => {
        await markDocumentFailed(
          documentId,
          extraction.failureReason ??
            `We couldn't process ${doc.originalFilename}. The document may be corrupted or unsupported.`
        );
        await recalculateCaseDocumentStats(caseId);
      });
      return { status: "failed" as const };
    }

    // Embedding is split into bounded batches, each its own step, so no single
    // step can run into the serverless time limit on a large document, and a
    // few batches run concurrently.
    const chunks = chunkPages(usablePages);
    const stepSize = embeddingStepSize();
    const batches: Array<{ start: number; end: number }> = [];
    for (let start = 0; start < chunks.length; start += stepSize) {
      batches.push({ start, end: Math.min(start + stepSize, chunks.length) });
    }

    for (let w = 0; w < batches.length; w += EMBED_WAVE) {
      await Promise.all(
        batches.slice(w, w + EMBED_WAVE).map((b, j) =>
          step.run(`embed-store-${w + j}`, async () => {
            const t0 = Date.now();
            const slice = chunks.slice(b.start, b.end);
            const embeddings = await embedTexts(slice.map((c) => c.text));
            await upsertDocumentChunks(
              slice.map((c, k) => ({
                documentId,
                caseId,
                ownerId,
                chunkIndex: b.start + k,
                pageNumber: c.pageNumber,
                text: c.text,
                embedding: embeddings[k],
              }))
            );
            console.log(`[doc-processing] embed-store-${w + j} chunks=${slice.length} ${Date.now() - t0}ms`);
          })
        )
      );
    }

    await step.run("mark-extracted", async () => {
      await markDocumentExtracted(documentId, usablePages.length);
      await recalculateCaseDocumentStats(caseId);
    });

    return { status: "extracted" as const, pageCount: usablePages.length };
  }
);
