import { inngest } from "@/inngest/client";
import { buildDraftContext } from "@/lib/ai/draftContext";
import { generate } from "@/lib/ai/router";
import { DraftContentSchema, buildDraftPrompt } from "@/lib/ai/prompts/drafting";
import { completeDraft, failDraft } from "@/lib/db/queries/drafts";
import type { DraftTemplateType } from "@/lib/cases/analysis-constants";
import { Draft } from "@/lib/db/models/Draft";
import { connectDB } from "@/lib/db/connect";

/**
 * draft.generate.requested — architecture §3/§7. Retrieves relevant case
 * context (key facts + top-k chunks matched to the lawyer's instructions),
 * generates the draft through the template-specific prompt, and marks the
 * Draft record ready — or failed, with a specific message, never a raw
 * stack trace, matching the rest of the pipeline's error-state discipline.
 */
export const draftGeneration = inngest.createFunction(
  { id: "draft-generation", name: "AI Draft Generator" },
  { event: "draft.generate.requested" },
  async ({ event, step }) => {
    const { draftId, caseId, ownerId } = event.data;

    const draftRecord = await step.run("load-draft", async () => {
      await connectDB();
      const record = await Draft.findOne({ _id: draftId, caseId, ownerId }).lean<{
        templateType: DraftTemplateType;
        instructions: string;
      }>();
      if (!record) throw new Error(`Draft ${draftId} not found for case ${caseId}`);
      return record;
    });

    try {
      const content = await step.run("generate-draft", async () => {
        const context = await buildDraftContext(caseId, ownerId, draftRecord.templateType, draftRecord.instructions);
        const { systemPrompt, userPrompt } = buildDraftPrompt(draftRecord.templateType, context, draftRecord.instructions);
        const result = await generate({
          systemPrompt,
          userPrompt,
          schema: DraftContentSchema,
          maxTokens: 3500,
        });
        return result.content;
      });

      await step.run("finalize", async () => {
        await completeDraft(draftId, content);
      });

      return { status: "ready" as const };
    } catch (err) {
      await step.run("mark-failed", async () => {
        await failDraft(
          draftId,
          "Advoka couldn't generate this draft. The AI service may be temporarily unavailable — try again in a moment."
        );
      });
      console.error("draft.generate.requested failed", err);
      return { status: "failed" as const };
    }
  }
);
