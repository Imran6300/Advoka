import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { Case } from "@/lib/db/models/Case";
import { CaseFact } from "@/lib/db/models/CaseFact";
import { Contradiction } from "@/lib/db/models/Contradiction";
import { MissingInfoFlag } from "@/lib/db/models/MissingInfoFlag";
import { GraphEdge } from "@/lib/db/models/GraphEdge";
import type { IUser } from "@/lib/db/models/User";
import type { GraphNodeType } from "@/lib/cases/graph-constants";
import { buildNodesAndEdges, type RawGraphRecords } from "@/lib/graph/buildNodesAndEdges";
import type { CaseGraphResponse } from "@/lib/cases/graph-types";
import { getCaseForOwner } from "@/lib/db/queries/cases";
import type { GraphEntityBundle } from "@/lib/graph/entities";

/**
 * Every function here is scoped to `{ caseId, ownerId }` — never trust a
 * client-supplied id (build plan non-negotiable), same discipline as
 * lib/db/queries/analysis.ts.
 */

export interface NewGraphEdge {
  caseId: Types.ObjectId | string;
  ownerId: Types.ObjectId | string;
  sourceType: GraphNodeType;
  sourceId: string;
  targetType: GraphNodeType;
  targetId: string;
  relationshipLabel: string;
  sourceDocumentId?: string;
  sourcePage?: number;
}

export async function insertGraphEdges(edges: NewGraphEdge[]) {
  if (edges.length === 0) return;
  await connectDB();
  await GraphEdge.insertMany(edges);
}

export async function clearGraphEdgesForCase(caseId: Types.ObjectId | string) {
  await connectDB();
  await GraphEdge.deleteMany({ caseId });
}

export async function markCaseReady(caseId: Types.ObjectId | string) {
  await connectDB();
  await Case.updateOne({ _id: caseId }, { $set: { status: "ready" } });
}

/**
 * Bare, unpopulated entity bundle (string ids, not populated docs) for the
 * graph-build Inngest function's mechanical-edge matching and LLM
 * ref-mapping — deliberately plain data, not the API-response shape
 * `getCaseGraphResponse` produces below.
 */
export async function loadGraphEntities(
  caseId: string,
  ownerId: Types.ObjectId | string
): Promise<GraphEntityBundle> {
  await connectDB();

  const [people, evidence, contradictions, missingInfo] = await Promise.all([
    CaseFact.find({ caseId, ownerId, type: "person" })
      .select("_id content personRole sourceDocumentId sourcePage")
      .lean<Array<{ _id: Types.ObjectId; content: string; personRole?: string; sourceDocumentId: Types.ObjectId; sourcePage: number }>>(),
    CaseFact.find({ caseId, ownerId, type: "evidence" })
      .select("_id content sourceDocumentId sourcePage")
      .lean<Array<{ _id: Types.ObjectId; content: string; sourceDocumentId: Types.ObjectId; sourcePage: number }>>(),
    Contradiction.find({ caseId, ownerId })
      .select("_id description sourceA sourceB")
      .lean<
        Array<{
          _id: Types.ObjectId;
          description: string;
          sourceA: { documentId: Types.ObjectId; page: number };
          sourceB: { documentId: Types.ObjectId; page: number };
        }>
      >(),
    MissingInfoFlag.find({ caseId, ownerId })
      .select("_id title sourceDocumentId sourcePage")
      .lean<Array<{ _id: Types.ObjectId; title: string; sourceDocumentId?: Types.ObjectId; sourcePage?: number }>>(),
  ]);

  return {
    people: people.map((p) => ({
      id: String(p._id),
      content: p.content,
      personRole: p.personRole,
      sourceDocumentId: String(p.sourceDocumentId),
      sourcePage: p.sourcePage,
    })),
    evidence: evidence.map((e) => ({
      id: String(e._id),
      content: e.content,
      sourceDocumentId: String(e.sourceDocumentId),
      sourcePage: e.sourcePage,
    })),
    contradictions: contradictions.map((c) => ({
      id: String(c._id),
      description: c.description,
      sourceA: { documentId: String(c.sourceA.documentId), page: c.sourceA.page },
      sourceB: { documentId: String(c.sourceB.documentId), page: c.sourceB.page },
    })),
    missingInfo: missingInfo.map((m) => ({
      id: String(m._id),
      title: m.title,
      sourceDocumentId: m.sourceDocumentId ? String(m.sourceDocumentId) : undefined,
      sourcePage: m.sourcePage,
    })),
  };
}

/**
 * Pulls every entity + edge for a case and assembles the React Flow-ready
 * `{ nodes[], edges[] }` payload, alongside the two status fields the
 * Graph tab needs to decide what to render (analysis still running? graph
 * still building? nothing analyzed yet?).
 */
export async function getCaseGraphResponse(owner: IUser, caseId: string): Promise<CaseGraphResponse | null> {
  await connectDB();
  if (!Types.ObjectId.isValid(caseId)) return null;

  const caseRecord = await getCaseForOwner(owner, caseId);
  if (!caseRecord) return null;

  const [people, evidence, contradictions, missingInfo, edges] = await Promise.all([
    CaseFact.find({ caseId, ownerId: owner._id, type: "person" })
      .populate("sourceDocumentId", "originalFilename")
      .lean<RawGraphRecords["people"]>(),
    CaseFact.find({ caseId, ownerId: owner._id, type: "evidence" })
      .populate("sourceDocumentId", "originalFilename")
      .lean<RawGraphRecords["evidence"]>(),
    Contradiction.find({ caseId, ownerId: owner._id })
      .populate("sourceA.documentId", "originalFilename")
      .populate("sourceB.documentId", "originalFilename")
      .lean<RawGraphRecords["contradictions"]>(),
    MissingInfoFlag.find({ caseId, ownerId: owner._id })
      .populate("sourceDocumentId", "originalFilename")
      .lean<RawGraphRecords["missingInfo"]>(),
    GraphEdge.find({ caseId, ownerId: owner._id })
      .populate("sourceDocumentId", "originalFilename")
      .lean<RawGraphRecords["edges"]>(),
  ]);

  const { nodes, edges: shapedEdges } = buildNodesAndEdges({
    people,
    evidence,
    contradictions,
    missingInfo,
    edges,
  });

  return {
    analysisStatus: caseRecord.analysis?.status ?? "not_started",
    caseStatus: caseRecord.status,
    nodes,
    edges: shapedEdges,
  };
}
