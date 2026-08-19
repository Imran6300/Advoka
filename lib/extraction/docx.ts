import mammoth from "mammoth";
import type { ExtractedPage } from "@/lib/extraction/pdf";

export interface DocxExtractionResult {
  pages: ExtractedPage[];
  pageCount: number;
}

/**
 * Word documents don't carry fixed page boundaries the way PDFs do — .docx
 * pagination is a rendering-time concern (font, margins, print settings),
 * and mammoth (like most .docx text extractors) doesn't expose it. For this
 * MVP we treat the whole document as a single page so every fact/citation
 * still resolves to a real, openable document — it just won't have a page
 * number finer than "page 1". Acceptable known limitation, not a bug.
 */
export async function extractDocxPages(buffer: Buffer): Promise<DocxExtractionResult> {
  const { value: text } = await mammoth.extractRawText({ buffer });
  const trimmed = text.trim();

  return {
    pages: trimmed ? [{ pageNumber: 1, text: trimmed }] : [],
    pageCount: trimmed ? 1 : 0,
  };
}
