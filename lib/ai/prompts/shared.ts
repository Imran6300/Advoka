// Build plan non-negotiable: "Language stays hedged per the design doc:
// 'potential contradiction,' 'AI generated draft,' 'requires verification' —
// never 'guaranteed correct.'" Every extraction system prompt includes this
// verbatim so it survives independently of whichever provider answers.
export const HEDGED_LANGUAGE_RULE = `Never present an interpretation as an established legal fact. Use hedged, careful language ("appears to," "may indicate," "the document states," "potential contradiction," "requires verification"). Never claim something is "guaranteed," "certain," or "proven." You are assisting a lawyer's review, not replacing it.`;

export const JSON_ONLY_RULE = `Respond with a single JSON object only — no markdown, no code fences, no commentary before or after the JSON. Every value must come from the provided document excerpts; never invent facts, dates, page numbers, or document ids.`;

export function formatContextBlock(contextBlock: string): string {
  return `--- CASE DOCUMENTS (each excerpt is tagged with its real documentId and page number — copy these values exactly when citing a source) ---\n${contextBlock}\n--- END CASE DOCUMENTS ---`;
}
