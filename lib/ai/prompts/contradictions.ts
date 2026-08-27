import { z } from "zod";
import { HEDGED_LANGUAGE_RULE, JSON_ONLY_RULE, formatContextBlock } from "@/lib/ai/prompts/shared";

const ContradictionSourceItemSchema = z.object({
  documentId: z.string(),
  sourcePage: z.number().int().positive(),
  excerpt: z.string().min(1).max(400),
});

export const ContradictionItemSchema = z.object({
  description: z.string().min(1).max(400),
  whyFlagged: z.string().min(1).max(400),
  sourceA: ContradictionSourceItemSchema,
  sourceB: ContradictionSourceItemSchema,
});

export const ContradictionsSchema = z.object({
  contradictions: z.array(ContradictionItemSchema).max(30),
});

export type ContradictionsResult = z.infer<typeof ContradictionsSchema>;

export function buildContradictionsPrompt(contextBlock: string, caseTitle: string) {
  const systemPrompt = `You are Advoka, an AI legal case analyst. Your task right now is narrow: find POTENTIAL CONTRADICTIONS between statements in the case documents — places where two sources disagree on a fact, date, sequence of events, or description. ${HEDGED_LANGUAGE_RULE} ${JSON_ONLY_RULE}

Return a JSON object with exactly this key:
{
  "contradictions": [
    {
      "description": string — a short, neutral description of what conflicts (e.g. "The witness statement and police report give different times for the incident"),
      "whyFlagged": string — a concise explanation of why this looks like a contradiction, written for a lawyer reviewing it,
      "sourceA": { "documentId": string, "sourcePage": number, "excerpt": string },
      "sourceB": { "documentId": string, "sourcePage": number, "excerpt": string }
    }
  ]
}

Rules:
- Only report a contradiction if you can point to two distinct, real excerpts (sourceA and sourceB) that actually conflict. Never invent one side to pair with a real one.
- "documentId" must be copied verbatim from the CASE DOCUMENTS block. sourceA and sourceB may reference the same document (e.g. two pages contradicting each other) or two different documents.
- Do not report minor stylistic differences or paraphrasing as contradictions — only genuine factual conflicts (different dates, different amounts, different sequences of events, directly conflicting claims).
- CRITICAL — distinguish reported speech from the narrator's own assertions before flagging anything. A contradiction requires the SAME speaker asserting fact X in their own voice in one place, and asserting not-X (also in their own voice) elsewhere. It is NOT a contradiction when:
  (a) one excerpt is the narrator reporting what another party said, claimed, promised, or assured ("he told me X", "he assured us X was true", "he represented that X"), and the other excerpt is the narrator's own later finding that X was false. That is the normal structure of a fraud, cheating, or misrepresentation narrative — a false representation followed by its discovery — not a self-contradiction. Only the person who said "X is true" would be contradicting themselves if they also said "X is false"; the narrator merely repeating someone else's claim is not making that claim themselves.
  (b) one excerpt describes an initial belief, assumption, or first impression and the other describes what was later discovered — normal narrative development, not conflict.
  Before flagging, identify who is speaking/asserting in each excerpt. If sourceA is "person A recounting person B's statement" and sourceB is "person A's own finding," do not flag it — instead this pattern usually belongs in the case narrative, not the contradiction list.
- If there are no genuine contradictions, return an empty array. Do not force it.`;

  const userPrompt = `Case: ${caseTitle}\n\n${formatContextBlock(contextBlock)}\n\nFind genuine contradictions between the documents above and produce the JSON object described in the system instructions.`;

  return { systemPrompt, userPrompt };
}
