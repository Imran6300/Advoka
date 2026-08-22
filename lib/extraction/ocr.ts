import { createWorker, type Worker } from "tesseract.js";
import type { ExtractedPage } from "@/lib/extraction/pdf";

export interface OcrExtractionResult {
  pages: ExtractedPage[];
  pageCount: number;
}

// Cache the worker on the global object, same reasoning as the Mongo
// connection cache and the embedding pipeline cache — a fresh
// createWorker("eng") re-downloads/re-initializes English language data on
// every single image upload otherwise. Warm serverless instances reuse
// this instead. Never terminated between calls (unlike the old
// create-then-terminate pattern) so it survives across invocations on the
// same warm instance; Vercel tears the whole process down between cold
// starts anyway, so there's no leak to worry about.
declare global {
  // eslint-disable-next-line no-var
  var _ocrWorker: Promise<Worker> | undefined;
}

async function getWorker(): Promise<Worker> {
  if (!global._ocrWorker) {
    global._ocrWorker = createWorker("eng");
  }
  return global._ocrWorker;
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
  let worker = await getWorker();

  let recognized;
  try {
    recognized = await worker.recognize(buffer);
  } catch (err) {
    // Worker can end up in a bad state (e.g. a previous call crashed
    // mid-recognize) — reinit once and retry rather than permanently
    // wedging every subsequent OCR call on this warm instance.
    global._ocrWorker = undefined;
    worker = await getWorker();
    recognized = await worker.recognize(buffer);
  }

  const trimmed = recognized.data.text.trim();
  return {
    pages: trimmed ? [{ pageNumber: 1, text: trimmed }] : [],
    pageCount: trimmed ? 1 : 0,
  };
}
