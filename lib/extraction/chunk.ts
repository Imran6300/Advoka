export interface TextChunk {
  pageNumber: number;
  text: string;
}

// A real BPE tokenizer isn't worth the extra dependency here — English text
// averages ~0.75 words per token, so ~500–800 tokens is roughly 375–600
// words. We target the middle of that range with a modest overlap so a
// sentence isn't orphaned right at a chunk boundary.
const TARGET_WORDS_PER_CHUNK = 480;
const OVERLAP_WORDS = 60;

/**
 * Chunks are built per page and never cross a page boundary — required so
 * every chunk (and therefore every citation built from it) resolves to
 * exactly one page number.
 */
export function chunkPageText(pageNumber: number, text: string): TextChunk[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  if (words.length <= TARGET_WORDS_PER_CHUNK) {
    return [{ pageNumber, text: words.join(" ") }];
  }

  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + TARGET_WORDS_PER_CHUNK, words.length);
    chunks.push({ pageNumber, text: words.slice(start, end).join(" ") });
    if (end === words.length) break;
    start = end - OVERLAP_WORDS;
  }

  return chunks;
}

export function chunkPages(pages: Array<{ pageNumber: number; text: string }>): TextChunk[] {
  return pages.flatMap((page) => chunkPageText(page.pageNumber, page.text));
}
