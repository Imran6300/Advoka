import { z } from "zod";
import { HEDGED_LANGUAGE_RULE, JSON_ONLY_RULE, formatContextBlock } from "@/lib/ai/prompts/shared";

export const FactItemSchema = z.object({
  type: z.enum(["fact", "person", "evidence"]),
  content: z.string().min(1).max(600),
  // Only meaningful when type === "person" (e.g. "Witness", "Accused", "Investigating Officer").
  personRole: z.string().max(80).optional(),
  documentId: z.string(),
  sourcePage: z.number().int().positive(),
  excerpt: z.string().min(1).max(400),
});

export const MissingInfoItemSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().min(1).max(500),
  actionLabel: z.string().min(1).max(80),
  documentId: z.string().optional(),
  sourcePage: z.number().int().positive().optional(),
  excerpt: z.string().max(400).optional(),
});

export const FactsAndSummarySchema = z.object({
  summary: z.string().min(1).max(2000),
  facts: z.array(FactItemSchema).max(60),
  missingInfo: z.array(MissingInfoItemSchema).max(30),
});

export type FactsAndSummaryResult = z.infer<typeof FactsAndSummarySchema>;

export function buildFactsAndSummaryPrompt(contextBlock: string, caseTitle: string) {
  const systemPrompt = `You are Advoka, an AI legal case analyst helping a lawyer in India review case documents. ${HEDGED_LANGUAGE_RULE} ${JSON_ONLY_RULE}

Return a JSON object with exactly these keys:
{
  "summary": string — a concise 3-6 sentence plain-language overview of the case based only on the documents provided,
  "facts": [ { "type": "fact" | "person" | "evidence", "content": string, "personRole"?: string, "documentId": string, "sourcePage": number, "excerpt": string } ],
  "missingInfo": [ { "title": string, "description": string, "actionLabel": string, "documentId"?: string, "sourcePage"?: number, "excerpt"?: string } ]
}

Guidance:
- "facts" should cover the most important key facts (type: "fact"), every distinct person mentioned (type: "person", with "personRole" like "Witness", "Accused", "Complainant", "Investigating Officer" when identifiable), and every distinct piece of evidence referenced (type: "evidence", e.g. a document, statement, or physical item).
- Every fact/person/evidence item MUST include the exact "documentId" (copied verbatim from the context) and "sourcePage" it came from, plus a short verbatim "excerpt" (under ~40 words) supporting it. If you cannot point to a specific source, omit the item entirely — do not guess.
- "missingInfo" should flag genuine gaps: a referenced document that was not uploaded, an unclear or missing date, a witness mentioned but no statement available, evidence referenced but not found, etc. Only include a "documentId"/"sourcePage"/"excerpt" on a missingInfo item if there is a specific passage that raised the flag — omit all three otherwise.
- Do not fabricate documentIds. Only use documentId values that appear in the CASE DOCUMENTS block below.`;

  const userPrompt = `Case: ${caseTitle}\n\n${formatContextBlock(contextBlock)}\n\nAnalyze the case documents above and produce the JSON object described in the system instructions.`;

  return { systemPrompt, userPrompt };
}
