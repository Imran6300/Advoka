import { z } from "zod";
import { HEDGED_LANGUAGE_RULE, JSON_ONLY_RULE } from "@/lib/ai/prompts/shared";
import type { RetrievedChunk } from "@/lib/ai/vectorSearch";
import type { CaseAnalysisResponse } from "@/lib/cases/analysis-types";

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
 * Bugfix — the four suggested chat questions ("key facts", "timeline",
 * "contradictions", "what's missing") each map 1:1 to a whole-case
 * analysis feature (CaseFact / TimelineEvent / Contradiction /
 * MissingInfoFlag) that already runs as its own Inngest job and gets
 * stored once "Analyze this case" completes. The chat route was never
 * wired to any of that — it only ever retrieved the top-k *raw* document
 * chunks nearest the question's embedding and told the model to answer
 * ONLY from those, never speculating. A gap ("what's missing") is by
 * definition not a sentence sitting in the source text, so that question
 * (and often the other three, depending on what the vector search
 * happened to retrieve) reliably came back "This isn't addressed in the
 * uploaded documents" even on fully analyzed cases with real findings
 * sitting in the DB.
 *
 * Fix: fold the case's already-computed analysis into the same excerpt
 * pool the raw chunks use (see chunksFromAnalysis in the chat route) plus
 * a second, clearly-labeled block below for findings that don't carry a
 * page citation (draftContext.ts already does the analogous thing for AI
 * drafting — this brings chat in line with that pattern).
 */
export function buildChatAnswerPrompt(
  caseTitle: string,
  chunks: RetrievedChunk[],
  history: Array<{ role: "user" | "assistant"; content: string }>,
  question: string,
  analysis?: CaseAnalysisResponse | null
) {
  const hasAnalysis = !!analysis && analysis.status === "ready";

  const systemPrompt = `You are Advoka, an AI legal case research assistant. A lawyer is asking a question about one specific case. Answer using ONLY the material provided below (document excerpts, and — when present — Advoka's own prior case analysis) — never use outside knowledge, and never speculate beyond what's given. ${HEDGED_LANGUAGE_RULE} ${JSON_ONLY_RULE}

Return a JSON object with exactly this key:
{
  "answer": string,
  "citations": [ { "documentId": string, "sourcePage": number, "excerpt": string } ]
}

Rules:
- If neither the excerpts nor the case analysis contain the answer, say so plainly in "answer" (e.g. "This isn't addressed in the uploaded documents.") and return an empty "citations" array. Never guess.
${hasAnalysis ? `- Some material below is labeled "Advoka's prior case analysis" rather than a raw document excerpt — these are findings Advoka already extracted for this case (key facts, contradictions, missing-information flags, timeline, deadlines). They're a valid basis for the answer, especially for meta questions like "what's missing", "summarize the timeline", "any contradictions", or "key facts" — you don't need the exact words to appear verbatim in a document.
- Analysis findings tagged with a documentId + page are cited exactly like a document excerpt. Some findings (most commonly a missing-information flag, since it's flagging something absent) carry no documentId/page — state those in "answer" without adding a citation entry for them; never invent a documentId or page number to cover one.
` : ""}- Every factual claim in "answer" that comes from a document excerpt or a cited analysis finding must be backed by at least one entry in "citations", copied verbatim (documentId and sourcePage) from the material below.
- Write "answer" as a lawyer scanning for an answer would want it: short paragraphs, and "- " prefixed bullet points for lists of items. No markdown headers, no bold text, no filler pleasantries ("Great question!", "I'd be happy to help") — get straight to the answer.
- Keep the answer focused and concise.`;

  const analysisBlock = hasAnalysis ? formatUncitedFindings(analysis!) : "";

  const userPrompt = `Case: ${caseTitle}\n\n--- RELEVANT MATERIAL (each item tagged with its real documentId and page number, or labeled as an Advoka analysis finding) ---\n${formatExcerpts(chunks)}\n--- END RELEVANT MATERIAL ---\n${analysisBlock}${formatHistory(history)}\nQuestion: ${question}\n\nAnswer using only the material above and produce the JSON object described in the system instructions.`;

  return { systemPrompt, userPrompt };
}

/**
 * Findings from the case analysis that have no source document/page to
 * cite (chiefly missing-information flags about something never uploaded
 * at all, plus the one-paragraph case summary). These can't be folded into
 * the citable excerpt pool since there's no real documentId/page to give
 * back to the citation-validation step in the chat route — they're kept
 * separate and the model is told not to invent a citation for them.
 */
function formatUncitedFindings(analysis: CaseAnalysisResponse): string {
  const lines: string[] = [];

  if (analysis.summary) {
    lines.push(`Case summary (from Advoka's analysis): ${analysis.summary}`);
  }

  const uncitedMissingInfo = analysis.missingInfo.filter((m) => !m.source);
  if (uncitedMissingInfo.length > 0) {
    lines.push(
      "Missing-information flags with no specific source page (cite none of these — state them plainly):",
      ...uncitedMissingInfo.map((m) => `- ${m.title}: ${m.description}`)
    );
  }

  if (lines.length === 0) return "";

  return `\n--- ADVOKA'S PRIOR CASE ANALYSIS (no page citation available for this part) ---\n${lines.join("\n")}\n--- END ANALYSIS ---\n`;
}
