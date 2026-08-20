import { z } from "zod";
import { HEDGED_LANGUAGE_RULE, JSON_ONLY_RULE } from "@/lib/ai/prompts/shared";
import { DRAFT_TEMPLATE_LABEL, type DraftTemplateType } from "@/lib/cases/analysis-constants";
import type { DraftContext } from "@/lib/ai/draftContext";

export const DraftContentSchema = z.object({
  content: z.string().min(1).max(12000),
});

export type DraftContentResult = z.infer<typeof DraftContentSchema>;

// Template-specific guidance — this is the thing that actually makes each
// of the 5 templates a distinct document rather than the same prompt with
// a different label pasted on top (build plan Day 6).
const TEMPLATE_GUIDANCE: Record<DraftTemplateType, string> = {
  legal_notice: `Draft a formal legal notice to the opposing party. Structure: a subject/heading line, a clear statement of the facts giving rise to the notice, the specific demand or relief sought, a reasonable deadline for response, and a formal closing. Use precise, unemotional legal language. Where a detail (address, exact date, statute) isn't in the provided context, use a bracketed placeholder like [ADDRESS] rather than inventing one.`,
  client_email: `Draft a professional but warm email updating the client on their case. Structure: a brief greeting, a plain-English summary of what's happened (avoid legal jargon — explain any term you must use), and clear next steps or what the client should expect. Keep it concise — this is an update, not a legal brief.`,
  case_summary: `Draft an internal case summary memo for the case file. Structure it with clear section labels: Background, Key Facts, Open Issues, Current Status. Written for another lawyer picking up the file, not the client.`,
  reply_to_notice: `Draft a formal written reply to a notice received from the opposing party. Structure: acknowledge the notice received, respond to its claims point by point using the case facts and evidence available, state the client's position clearly, and close formally. Where the notice's specific claims aren't in the provided context, respond generally rather than inventing specifics.`,
  application: `Draft a formal application or petition (e.g. to a court, tribunal, or authority) built from the case facts and the lawyer's instructions below. Structure: parties involved, statement of facts, grounds/basis for the application, and the specific relief or order sought. Use bracketed placeholders like [COURT NAME] or [CASE NUMBER] for anything not available in the provided context.`,
};

export function buildDraftPrompt(templateType: DraftTemplateType, context: DraftContext, instructions: string) {
  const systemPrompt = `You are Advoka, an AI legal drafting assistant. Your task is to draft a ${DRAFT_TEMPLATE_LABEL[templateType]} for the case described below, grounded in the case facts and excerpts provided, following the lawyer's specific instructions. ${HEDGED_LANGUAGE_RULE} ${JSON_ONLY_RULE}

${TEMPLATE_GUIDANCE[templateType]}

Return a JSON object with exactly this key:
{ "content": string }

Rules:
- "content" is the full draft document as plain text, with blank lines between sections/paragraphs. Do not use markdown syntax (no #, no **, no markdown lists) — this will be edited in a plain text editor.
- Ground the draft in the case facts and excerpts provided below wherever they're relevant — don't contradict them.
- Follow the lawyer's instructions precisely; they take priority over your own judgment about what to include.
- This is a draft for a lawyer to review and edit before use, not a final document — it's fine (and expected) to leave bracketed placeholders for details you don't have, rather than inventing them.`;

  const partiesLine = `Client: ${context.clientName}${context.opposingParty ? ` | Opposing party: ${context.opposingParty}` : ""}${context.importantDate ? ` | Important date: ${new Date(context.importantDate).toLocaleDateString()}` : ""}`;

  const userPrompt = `Case: ${context.caseTitle} (${context.caseType})\n${partiesLine}\n${context.summary ? `\nCase summary: ${context.summary}\n` : ""}\n${context.contextBlock ? `--- CASE CONTEXT ---\n${context.contextBlock}\n--- END CASE CONTEXT ---\n` : ""}\nLawyer's instructions: ${instructions}\n\nDraft the ${DRAFT_TEMPLATE_LABEL[templateType]} now, following the system instructions, and produce the JSON object described above.`;

  return { systemPrompt, userPrompt };
}
