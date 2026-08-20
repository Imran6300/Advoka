import { Types } from "mongoose";
import { inngest } from "@/inngest/client";
import { connectDB } from "@/lib/db/connect";
import { Case } from "@/lib/db/models/Case";
import { generate } from "@/lib/ai/router";
import {
  GraphRelationshipsSchema,
  buildGraphRelationshipsPrompt,
} from "@/lib/ai/prompts/graphRelationships";
import { buildMechanicalEdges, edgeKey, type DraftEdge } from "@/lib/graph/entities";
import { buildEntityRefs } from "@/lib/graph/entityRefs";
import {
  loadGraphEntities,
  clearGraphEdgesForCase,
  insertGraphEdges,
  markCaseReady,
  type NewGraphEdge,
} from "@/lib/db/queries/graph";

/**
 * case.graph.build — architecture §7 "Case Graph Builder" / build plan
 * Day 5. Fired automatically once `case.analyze.requested` finishes
 * (inngest/functions/caseAnalysis.ts's finalize step). Two passes:
 *
 *   1. Mechanical edges — contradiction↔person, evidence↔person on the
 *      same source page. Cheap, no LLM call, trustworthy by construction
 *      (real sourceDocumentId + sourcePage on every one).
 *   2. One LLM pass over everything else, referencing entities by short
 *      ids so output maps back to real `_id`s deterministically. Anything
 *      the model proposes that references an unknown ref, links an entity
 *      to itself, or duplicates a mechanical edge is dropped.
 *
 * `Case.status` only flips to "ready" once this function's finalize step
 * runs — the graph is part of "case ready," not an optional extra
 * (architecture §7) — but a failure in either pass never blocks that: the
 * case's analysis already succeeded, so the graph tab simply shows fewer
 * (or zero) relationships rather than the whole case staying stuck on
 * "Processing" forever.
 */
export const graphBuild = inngest.createFunction(
  { id: "case-graph-build", name: "Case Graph Builder" },
  { event: "case.graph.build" },
  async ({ event, step }) => {
    const { caseId, ownerId } = event.data;

    const caseRecord = await step.run("load-case", async () => {
      await connectDB();
      const record = await Case.findOne({ _id: caseId, ownerId }).lean<{
        _id: Types.ObjectId;
        title: string;
      }>();
      if (!record) throw new Error(`Case ${caseId} not found for owner ${ownerId}`);
      return { title: record.title };
    });

    const entities = await step.run("load-entities", async () => {
      return loadGraphEntities(caseId, ownerId);
    });

    await step.run("clear-previous-edges", async () => {
      await clearGraphEdgesForCase(caseId);
    });

    const mechanicalEdges = await step.run("mechanical-edges", async () => {
      const edges = buildMechanicalEdges(entities);
      await insertGraphEdges(toNewGraphEdges(edges, caseId, ownerId));
      return edges;
    });

    const totalEntities =
      entities.people.length + entities.evidence.length + entities.contradictions.length + entities.missingInfo.length;

    // Skip the LLM pass entirely below two entities — nothing to relate,
    // and it avoids burning a provider call on a near-empty case.
    if (totalEntities >= 2) {
      await step.run("llm-relationships", async () => {
        try {
          const { refMap, entitiesBlock } = buildEntityRefs(entities);
          if (refMap.size < 2) return;

          const { systemPrompt, userPrompt } = buildGraphRelationshipsPrompt(entitiesBlock, caseRecord.title);
          const result = await generate({
            systemPrompt,
            userPrompt,
            schema: GraphRelationshipsSchema,
            maxTokens: 2000,
          });

          const mechanicalKeys = new Set(mechanicalEdges.map((e) => edgeKey(e)));
          const seen = new Set<string>();
          const llmEdges: DraftEdge[] = [];

          for (const rel of result.relationships) {
            if (rel.sourceRef === rel.targetRef) continue;
            const source = refMap.get(rel.sourceRef);
            const target = refMap.get(rel.targetRef);
            if (!source || !target) continue; // hallucinated ref — drop rather than guess

            const key = edgeKey({
              sourceType: source.type,
              sourceId: source.id,
              targetType: target.type,
              targetId: target.id,
            });
            if (mechanicalKeys.has(key) || seen.has(key)) continue;
            seen.add(key);

            llmEdges.push({
              sourceType: source.type,
              sourceId: source.id,
              targetType: target.type,
              targetId: target.id,
              relationshipLabel: rel.relationshipLabel,
              // Intentionally left unsourced — this relationship came from
              // the model's read of the case, not a shared page reference,
              // so the graph UI renders it as visibly lower-confidence
              // (dashed edge, "possibly related") rather than claiming a
              // traceable source it doesn't have (architecture §14).
            });
          }

          await insertGraphEdges(toNewGraphEdges(llmEdges, caseId, ownerId));
        } catch (err) {
          // A failed/unparseable LLM relationship pass shouldn't cost the
          // lawyer the mechanical edges already saved above — log and move
          // on, same "mark as review needed rather than crash" discipline
          // as the rest of the AI pipeline (architecture §7).
          console.error("case.graph.build: LLM relationship pass failed", err);
        }
      });
    }

    await step.run("finalize", async () => {
      await markCaseReady(caseId);
    });

    return { status: "ready" as const };
  }
);

function toNewGraphEdges(edges: DraftEdge[], caseId: string, ownerId: string): NewGraphEdge[] {
  return edges.map((e) => ({
    caseId,
    ownerId,
    sourceType: e.sourceType,
    sourceId: e.sourceId,
    targetType: e.targetType,
    targetId: e.targetId,
    relationshipLabel: e.relationshipLabel,
    sourceDocumentId: e.sourceDocumentId,
    sourcePage: e.sourcePage,
  }));
}

