import pdfParse from "pdf-parse";

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface PdfExtractionResult {
  pages: ExtractedPage[];
  pageCount: number;
  /** True when every page came back near-empty — almost certainly a scanned PDF. */
  looksScanned: boolean;
}

const MIN_CHARS_PER_PAGE_TO_COUNT_AS_TEXT = 20;

/**
 * pdf-parse only gives you one flattened `text` blob by default. We hook
 * `pagerender` to capture each page's text separately — required for page
 * citations everywhere downstream (facts, timeline, chat, the graph).
 */
export async function extractPdfPages(buffer: Buffer): Promise<PdfExtractionResult> {
  const pages: ExtractedPage[] = [];

  await pdfParse(buffer, {
    pagerender: async (pageData) => {
      const content = await pageData.getTextContent();
      const text = content.items.map((item) => item.str).join(" ");
      pages.push({ pageNumber: pages.length + 1, text: text.trim() });
      // pdf-parse concatenates whatever we return into its own `.text` blob;
      // we don't use that blob, so the return value here doesn't matter much
      // beyond keeping pdf-parse's internal bookkeeping happy.
      return text;
    },
  });

  const nonEmptyPages = pages.filter((p) => p.text.length >= MIN_CHARS_PER_PAGE_TO_COUNT_AS_TEXT);

  return {
    pages,
    pageCount: pages.length,
    looksScanned: pages.length > 0 && nonEmptyPages.length === 0,
  };
}
