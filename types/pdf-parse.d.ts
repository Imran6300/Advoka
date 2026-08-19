declare module "pdf-parse" {
  interface PDFPageProxy {
    getTextContent: () => Promise<{ items: Array<{ str: string }> }>;
  }

  interface PDFParseOptions {
    pagerender?: (pageData: PDFPageProxy) => Promise<string>;
    max?: number;
  }

  interface PDFParseResult {
    text: string;
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    version: string;
  }

  function pdfParse(buffer: Buffer, options?: PDFParseOptions): Promise<PDFParseResult>;
  export = pdfParse;
}
