import { createWorker } from "tesseract.js";
import type { ExtractedPage } from "@/lib/extraction/pdf";

export interface OcrExtractionResult {
  pages: ExtractedPage[];
  pageCount: number;
}

/**
 * Standalone image uploads (jpg/png/etc.) — OCR'd as a single page. This is
 * distinct from *scanned PDFs*: rendering a PDF's pages to images before OCR
 * needs a PDF-to-image step (e.g. poppler) with system dependencies this
 * build doesn't assume are present, so scanned PDFs are flagged as
 * unsupported for now (see lib/inngest/functions/documentProcessing.ts)
 * rather than silently producing broken output.
 */
export async function extractImageText(buffer: Buffer): Promise<OcrExtractionResult> {
  const worker = await createWorker("eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(buffer);
    const trimmed = text.trim();
    return {
      pages: trimmed ? [{ pageNumber: 1, text: trimmed }] : [],
      pageCount: trimmed ? 1 : 0,
    };
  } finally {
    await worker.terminate();
  }
}
