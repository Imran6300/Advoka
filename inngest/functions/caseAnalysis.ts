import { Types } from "mongoose";
import { inngest } from "@/inngest/client";
import { connectDB } from "@/lib/db/connect";
import { Case } from "@/lib/db/models/Case";
import { Document } from "@/lib/db/models/Document";
import { generate, LLMGenerationError } from "@/lib/ai/router";
import { buildCaseAnalysisContext } from "@/lib/ai/caseContext";
import { keepOnlyVerifiableSources, keepIfSourcedOrUnsourced } from "@/lib/ai/analysisValidation";
import {
  FactsAndSummarySchema,
  buildFactsAndSummaryPrompt,
} from "@/lib/ai/prompts/factsAndSummary";
import { ContradictionsSchema, buildContradictionsPrompt } from "@/lib/ai/prompts/contradictions";
import {
  TimelineAndDeadlinesSchema,
  buildTimelineAndDeadlinesPrompt,
} from "@/lib/ai/prompts/timelineAndDeadlines";
import {
  startCaseAnalysis,
  setAnalysisStep,
  completeCaseAnalysis,
  failCaseAnalysis,
  clearCaseAnalysisOutput,
  insertCaseFacts,
  insertMissingInfoFlags,
  insertContradictions,
  insertTimelineEvents,
  insertDeadlines,
  recalculateCaseAnalysisStats,
} from "@/lib/db/queries/analysis";

/**
 * case.analyze.requested — architecture §7 "Case Analyzer" / build plan Day 4.
 *
 * Runs once all of a case's documents are extracted. Six steps, matching the
 * checklist shown in the UI 1:1 (§9 AI processing experience):
 *   ✓ Documents received / ✓ Text extracted / ✓ Documents indexed
 *   ● Finding key facts → ○ Detecting contradictions → ○ Building timeline
 *
 * Every LLM-extracted item is validated against the case's real document ids
 * before it's allowed into the database — anything without a verifiable
 * source is silently dropped, never shown (build plan non-negotiable).
 */
export const caseAnalysis = inngest.createFunction(
  {
    id: "case-analysis",
    name: "AI Case Analyzer",
    // Heaviest LLM consumer of the four functions — several generate()
    // calls per run (facts/summary, contradictions, timeline/deadlines).
    // Kept tighter than document-processing so concurrent "Analyze" clicks
    // across cases don't multiply that out and burn through every free-tier
    // provider's rate limit at once.
    concurrency: { limit: 3 },
    // LLM failures already walk every provider inside generate(); retrying the
    // whole step 4 more times just multiplies the wait before the user sees a result.
    retries: 2,
  },
  { event: "case.analyze.requested" },
  async ({ event, step }) => {
    const { caseId, ownerId } = event.data;

    const caseRecord = await step.run("load-case", async () => {
      await connectDB();
      const record = await Case.findOne({ _id: caseId, ownerId }).lean<{
        _id: Types.ObjectId;
        title: string;
      }>();
      if (!record) throw new Error(`Case ${caseId} not found for owner ${ownerId}`);

      const extractedCount = await Document.countDocuments({ caseId, ownerId, status: "extracted" });
      if (extractedCount === 0) {
        throw new Error(`Case ${caseId} has no extracted documents to analyze`);
      }

      return { title: record.title };
    });

    try {
      // reset + preflight + build-context merged into ONE step
      // (3 Inngest round trips -> 1). Idempotent trigger: re-running replaces
      // prior output rather than duplicating it.
      const context = await step.run("prepare", async () => {
        await clearCaseAnalysisOutput(caseId);
        await startCaseAnalysis(caseId);

        // Already true by the time this event fires — mark done immediately.
        await setAnalysisStep(caseId, "documentsReceived", "done");
        await setAnalysisStep(caseId, "textExtracted", "done");
        await setAnalysisStep(caseId, "documentsIndexed", "done");

        const ctx = await buildCaseAnalysisContext(caseId, ownerId);
        if (ctx.totalChunks === 0) {
          throw new Error("No indexed document text found for this case.");
        }
        return ctx;
      });

      // The three LLM passes only depend on `context`, not on each other, so
      // they run CONCURRENTLY (each is its own step). Wall time is now the
      // slowest single call instead of the sum of all three.
      const [factsResult] = await Promise.all([
      // --- Step: Finding key facts (summary + facts/people/evidence + missing info) ---
        step.run("finding-facts", async () => {
        await setAnalysisStep(caseId, "findingFacts", "active");

        const { systemPrompt, userPrompt } = buildFactsAndSummaryPrompt(
          context.contextBlock,
          caseRecord.title
        );
        const result = await generate({
          systemPrompt,
          userPrompt,
          schema: FactsAndSummarySchema,
          maxTokens: 4000,
        });

        const verifiedFacts = keepOnlyVerifiableSources(result.facts, context.documents);
        const verifiedMissingInfo = keepIfSourcedOrUnsourced(result.missingInfo, context.documents);

        await insertCaseFacts(
          verifiedFacts.map((f) => ({
            caseId,
            ownerId,
            type: f.type,
            content: f.content,
            personRole: f.personRole,
            sourceDocumentId: f.documentId,
            sourcePage: f.sourcePage,
            sourceExcerpt: f.excerpt,
          }))
        );

        await insertMissingInfoFlags(
          verifiedMissingInfo.map((m) => ({
            caseId,
            ownerId,
            title: m.title,
            description: m.description,
            actionLabel: m.actionLabel,
            sourceDocumentId: m.documentId,
            sourcePage: m.sourcePage,
            sourceExcerpt: m.excerpt,
          }))
        );

        await setAnalysisStep(caseId, "findingFacts", "done");
        return { summary: result.summary };
      }),

      // --- Step: Detecting contradictions ---
        step.run("detecting-contradictions", async () => {
        await setAnalysisStep(caseId, "detectingContradictions", "active");

        const { systemPrompt, userPrompt } = buildContradictionsPrompt(
          context.contextBlock,
          caseRecord.title
        );
        const result = await generate({
          systemPrompt,
          userPrompt,
          schema: ContradictionsSchema,
          maxTokens: 3000,
        });

        const knownIds = new Set(context.documents.map((d) => d.id));
        const verified = result.contradictions.filter(
          (c) =>
            knownIds.has(c.sourceA.documentId) &&
            knownIds.has(c.sourceB.documentId) &&
            c.sourceA.sourcePage > 0 &&
            c.sourceB.sourcePage > 0
        );

        await insertContradictions(
          verified.map((c) => ({
            caseId,
            ownerId,
            description: c.description,
            whyFlagged: c.whyFlagged,
            sourceA: { documentId: c.sourceA.documentId, page: c.sourceA.sourcePage, excerpt: c.sourceA.excerpt },
            sourceB: { documentId: c.sourceB.documentId, page: c.sourceB.sourcePage, excerpt: c.sourceB.excerpt },
          }))
        );

        await setAnalysisStep(caseId, "detectingContradictions", "done");
      }),

      // --- Step: Building timeline (+ deadlines) ---
        step.run("building-timeline", async () => {
        await setAnalysisStep(caseId, "buildingTimeline", "active");

        const { systemPrompt, userPrompt } = buildTimelineAndDeadlinesPrompt(
          context.contextBlock,
          caseRecord.title
        );
        const result = await generate({
          systemPrompt,
          userPrompt,
          schema: TimelineAndDeadlinesSchema,
          maxTokens: 3500,
        });

        const verifiedTimeline = keepOnlyVerifiableSources(result.timeline, context.documents);
        const verifiedDeadlines = keepOnlyVerifiableSources(result.deadlines, context.documents);

        await insertTimelineEvents(
          verifiedTimeline.map((t) => ({
            caseId,
            ownerId,
            date: t.date ? new Date(t.date) : undefined,
            description: t.description,
            sourceDocumentId: t.documentId,
            sourcePage: t.sourcePage,
            sourceExcerpt: t.excerpt,
          }))
        );

        await insertDeadlines(
          verifiedDeadlines
            .filter((d) => !Number.isNaN(new Date(d.dueDate).getTime()))
            .map((d) => ({
              caseId,
              ownerId,
              description: d.description,
              dueDate: new Date(d.dueDate),
              sourceDocumentId: d.documentId,
              sourcePage: d.sourcePage,
              sourceExcerpt: d.excerpt,
            }))
        );

        await setAnalysisStep(caseId, "buildingTimeline", "done");
      }),
      ]);

      await step.run("finalize", async () => {
        await recalculateCaseAnalysisStats(caseId);
        await completeCaseAnalysis(caseId, factsResult.summary);
      });

      // Case Graph Builder (Day 5) runs immediately after the analyzer, as
      // its own Inngest step/function — Case.status only flips to "ready"
      // once *that* finishes, not here (architecture §7).
      await step.sendEvent("trigger-graph-build", {
        name: "case.graph.build",
        data: { caseId, ownerId },
      });

      return { status: "ready" as const };
    } catch (err) {
      if (err instanceof LLMGenerationError) {
        // The user-facing message is deliberately generic — this is the
        // actual per-provider reason (401/403/rate-limit/etc), logged so
        // it's visible in Vercel's runtime logs instead of being discarded.
        console.error("[caseAnalysis] LLM provider attempts:", JSON.stringify(err.attempts, null, 2));
      }

      const message =
        err instanceof LLMGenerationError
          ? "Advoka couldn't reach an AI provider to analyze this case. Please try again shortly."
          : err instanceof Error
            ? err.message
            : "Something went wrong while analyzing this case.";

      await step.run("mark-failed", async () => {
        await failCaseAnalysis(caseId, message);
      });

      return { status: "failed" as const, error: message };
    }
  }
);