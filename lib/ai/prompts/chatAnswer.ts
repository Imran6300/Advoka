import { z } from "zod";
import { HEDGED_LANGUAGE_RULE, JSON_ONLY_RULE } from "@/lib/ai/prompts/shared";
import type { RetrievedChunk } from "@/lib/ai/vectorSearch";

const ChatCitationItemSchema = z.object({
  documentId: z.string(),
  sourcePage: z.number().int().positive(),
  excerpt: z.string().min(1).max(400),
});

export const ChatAnswerSchema = z.object({
  answer: z.string().min(1).max(3000),
  citations: z.array(ChatCitationItemSchema).max(10),
});

export type ChatAnswerResult = z.infer<typeof ChatAnswerSchema>;

function formatExcerpts(chunks: RetrievedChunk[]): string {
  return chunks
    .map((c) => `[Document: ${c.documentName} | documentId: ${c.documentId} | Page ${c.pageNumber}]\n${c.text}`)
    .join("\n\n");
}

function formatHistory(history: Array<{ role: "user" | "assistant"; content: string }>): string {
  if (history.length === 0) return "";
  const lines = history.map((m) => `${m.role === "user" ? "Lawyer" : "Advoka"}: ${m.content}`);
  return `\n--- RECENT CONVERSATION (for context on follow-up questions) ---\n${lines.join("\n")}\n--- END RECENT CONVERSATION ---\n`;
}

/**
 * architecture §7 "Ask Your Case": "answer only from the provided
 * excerpts; say so if the answer isn't there; cite document + page for
 * every claim." Build plan §non-negotiable: hedged language, always.
 */
export function buildChatAnswerPrompt(
  caseTitle: string,
  chunks: RetrievedChunk[],
  history: Array<{ role: "user" | "assistant"; content: string }>,
  question: string
) {
  const systemPrompt = `You are Advoka, an AI legal case research assistant. A lawyer is asking a question about one specific case. Answer using ONLY the excerpts provided below — never use outside knowledge, and never speculate beyond what the excerpts say. ${HEDGED_LANGUAGE_RULE} ${JSON_ONLY_RULE}

Return a JSON object with exactly this key:
{
  "answer": string,
  "citations": [ { "documentId": string, "sourcePage": number, "excerpt": string } ]
}

Rules:
- If the excerpts don't contain the answer, say so plainly in "answer" (e.g. "This isn't addressed in the uploaded documents.") and return an empty "citations" array. Never guess.
- Every factual claim in "answer" must be backed by at least one entry in "citations", copied verbatim (documentId and sourcePage) from the excerpts below.
- Write "answer" as a lawyer scanning for an answer would want it: short paragraphs, and "- " prefixed bullet points for lists of items. No markdown headers, no bold text, no filler pleasantries ("Great question!", "I'd be happy to help") — get straight to the answer.
- Keep the answer focused and concise.`;

  const userPrompt = `Case: ${caseTitle}\n\n--- RELEVANT EXCERPTS (each tagged with its real documentId and page number) ---\n${formatExcerpts(chunks)}\n--- END EXCERPTS ---\n${formatHistory(history)}\nQuestion: ${question}\n\nAnswer using only the excerpts above and produce the JSON object described in the system instructions.`;

  return { systemPrompt, userPrompt };
}
