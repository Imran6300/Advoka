import type { KnownDocument } from "@/lib/ai/caseContext";

interface SourcedItem {
  documentId: string;
  sourcePage: number;
}

/**
 * "Every AI-extracted claim carries a documentId + pageNumber or it gets
 * dropped, not shown" (build plan non-negotiable / architecture §15). The
 * model is instructed to copy documentId verbatim from the context block,
 * but instructions aren't guarantees — so every item is checked against the
 * real set of document ids for this case before it's allowed anywhere near
 * the database.
 */
export function keepOnlyVerifiableSources<T extends SourcedItem>(
  items: T[],
  knownDocuments: KnownDocument[]
): T[] {
  const knownIds = new Set(knownDocuments.map((d) => d.id));
  return items.filter(
    (item) =>
      typeof item.documentId === "string" &&
      knownIds.has(item.documentId) &&
      Number.isInteger(item.sourcePage) &&
      item.sourcePage > 0
  );
}

/** Same rule, but for items where the source is optional (e.g. MissingInfoFlag). */
export function keepIfSourcedOrUnsourced<T extends Partial<SourcedItem>>(
  items: T[],
  knownDocuments: KnownDocument[]
): T[] {
  const knownIds = new Set(knownDocuments.map((d) => d.id));
  return items.filter((item) => {
    if (item.documentId === undefined && item.sourcePage === undefined) return true;
    return (
      typeof item.documentId === "string" &&
      knownIds.has(item.documentId) &&
      Number.isInteger(item.sourcePage) &&
      (item.sourcePage as number) > 0
    );
  });
}
