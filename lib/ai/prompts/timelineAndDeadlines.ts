import { z } from "zod";
import { HEDGED_LANGUAGE_RULE, JSON_ONLY_RULE, formatContextBlock } from "@/lib/ai/prompts/shared";

export const TimelineItemSchema = z.object({
  // ISO date string (YYYY-MM-DD) when a specific date is identifiable; omit if the source is undated.
  date: z.string().optional(),
  description: z.string().min(1).max(400),
  documentId: z.string(),
  sourcePage: z.number().int().positive(),
  excerpt: z.string().min(1).max(400),
});

export const DeadlineItemSchema = z.object({
  description: z.string().min(1).max(300),
  // ISO date string (YYYY-MM-DD) — required, since an undated item isn't a deadline.
  dueDate: z.string(),
  documentId: z.string(),
  sourcePage: z.number().int().positive(),
  excerpt: z.string().min(1).max(400),
});

export const TimelineAndDeadlinesSchema = z.object({
  timeline: z.array(TimelineItemSchema).max(60),
  deadlines: z.array(DeadlineItemSchema).max(30),
});

export type TimelineAndDeadlinesResult = z.infer<typeof TimelineAndDeadlinesSchema>;

export function buildTimelineAndDeadlinesPrompt(contextBlock: string, caseTitle: string) {
  const systemPrompt = `You are Advoka, an AI legal case analyst. Your task right now is narrow: extract a chronological TIMELINE of events, and separately identify any DEADLINES (dates by which the lawyer or client must act or respond — hearing dates, filing deadlines, response windows, limitation periods). ${HEDGED_LANGUAGE_RULE} ${JSON_ONLY_RULE}

Return a JSON object with exactly these keys:
{
  "timeline": [ { "date"?: string (YYYY-MM-DD), "description": string, "documentId": string, "sourcePage": number, "excerpt": string } ],
  "deadlines": [ { "description": string, "dueDate": string (YYYY-MM-DD), "documentId": string, "sourcePage": number, "excerpt": string } ]
}

Rules:
- "timeline" events should be ordered chronologically where dates are known. If an event is clearly sequenced in the narrative but has no explicit date in the text, omit "date" rather than guessing one.
- "deadlines" must have an explicit "dueDate" — only include an item here if the source text states or clearly implies an actual date. Do not include a deadline without a real date found in the text.
- Every item MUST include the exact "documentId" (copied verbatim from the context) and "sourcePage" it came from, plus a short verbatim "excerpt" supporting it. If you cannot point to a specific source, omit the item entirely.
- Do not fabricate dates. If a date is ambiguous or unclear in the source, it likely belongs in a missing-information flag instead (handled separately) — simply omit it here.`;

  const userPrompt = `Case: ${caseTitle}\n\n${formatContextBlock(contextBlock)}\n\nExtract the timeline and deadlines from the documents above and produce the JSON object described in the system instructions.`;

  return { systemPrompt, userPrompt };
}
