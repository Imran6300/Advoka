import { inngest } from "@/inngest/client";
import { downloadDocumentBuffer } from "@/lib/storage/supabase";
import { extractPdfPages, type ExtractedPage } from "@/lib/extraction/pdf";
import { extractDocxPages } from "@/lib/extraction/docx";
import { extractImageText } from "@/lib/extraction/ocr";
import { chunkPages } from "@/lib/extraction/chunk";
import { embedTexts } from "@/lib/ai/embeddings";
import {
  getDocumentByEventRef,
  markDocumentExtracting,
  markDocumentExtracted,
  markDocumentFailed,
  deleteChunksForDocument,
  insertDocumentChunks,
  recalculateCaseDocumentStats,
} from "@/lib/db/queries/documents";

const PDF_TYPES = new Set(["application/pdf"]);
const DOCX_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/tiff"]);

interface ExtractionOutcome {
  pages: ExtractedPage[];
  failureReason?: string;
}

export const documentProcessing = inngest.createFunction(
  { id: "document-processing", name: "Document Processing" },
  { event: "document.uploaded" },
  async ({ event, step }) => {
    const { documentId, caseId, ownerId } = event.data;

    const doc = await step.run("load-document", async () => {
      const record = await getDocumentByEventRef({ documentId, caseId, ownerId });
      if (!record) throw new Error(`Document ${documentId} not found for case ${caseId}`);
      return {
        mimeType: record.mimeType,
        storageUrl: record.storageUrl,
        originalFilename: record.originalFilename,
      };
    });

    await step.run("mark-extracting", async () => {
      await markDocumentExtracting(documentId);
    });

    // The buffer itself never crosses a step boundary (Inngest persists step
    // return values as JSON) — only the extracted, JSON-safe text does.
    const extraction = await step.run("extract-text", async (): Promise<ExtractionOutcome> => {
      const buffer = await downloadDocumentBuffer(doc.storageUrl);

      if (PDF_TYPES.has(doc.mimeType)) {
        const result = await extractPdfPages(buffer);
        if (result.looksScanned) {
          return {
            pages: [],
            failureReason:
              "This PDF appears to be scanned or image-only. OCR for scanned PDFs isn't supported yet — try re-uploading the pages as images instead.",
          };
        }
        return { pages: result.pages };
      }

      if (DOCX_TYPES.has(doc.mimeType)) {
        const result = await extractDocxPages(buffer);
        return { pages: result.pages };
      }

      if (IMAGE_TYPES.has(doc.mimeType)) {
        const result = await extractImageText(buffer);
        return { pages: result.pages };
      }

      return {
        pages: [],
        failureReason: `Unsupported file type (${doc.mimeType}). Advoka currently supports PDF, DOCX, and common image formats.`,
      };
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

    await step.run("chunk-embed-store", async () => {
      const chunks = chunkPages(usablePages);
      const embeddings = await embedTexts(chunks.map((c) => c.text));

      // Re-processing (Try Again) should replace, not duplicate, chunks.
      await deleteChunksForDocument(documentId);
      await insertDocumentChunks(
        chunks.map((chunk, i) => ({
          documentId,
          caseId,
          ownerId,
          pageNumber: chunk.pageNumber,
          text: chunk.text,
          embedding: embeddings[i],
        }))
      );
    });

    await step.run("mark-extracted", async () => {
      await markDocumentExtracted(documentId, usablePages.length);
      await recalculateCaseDocumentStats(caseId);
    });

    return { status: "extracted" as const, pageCount: usablePages.length };
  }
);
