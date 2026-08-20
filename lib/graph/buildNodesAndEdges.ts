import { Types } from "mongoose";
import type { GraphNodeResponse, GraphEdgeResponse } from "@/lib/cases/graph-types";
import type { VisibleGraphNodeType } from "@/lib/cases/graph-constants";

interface DocRef {
  _id: Types.ObjectId;
  originalFilename: string;
}

interface LeanPerson {
  _id: Types.ObjectId;
  content: string;
  personRole?: string;
  sourceDocumentId: DocRef;
  sourcePage: number;
  sourceExcerpt: string;
}

interface LeanEvidence {
  _id: Types.ObjectId;
  content: string;
  sourceDocumentId: DocRef;
  sourcePage: number;
  sourceExcerpt: string;
}

interface LeanContradiction {
  _id: Types.ObjectId;
  description: string;
  whyFlagged: string;
  sourceA: { documentId: DocRef; page: number; excerpt: string };
  sourceB: { documentId: DocRef; page: number; excerpt: string };
}

interface LeanMissingInfo {
  _id: Types.ObjectId;
  title: string;
  description: string;
  actionLabel: string;
  sourceDocumentId?: DocRef;
  sourcePage?: number;
  sourceExcerpt?: string;
}

interface LeanGraphEdge {
  _id: Types.ObjectId;
  sourceType: VisibleGraphNodeType | "fact";
  sourceId: Types.ObjectId;
  targetType: VisibleGraphNodeType | "fact";
  targetId: Types.ObjectId;
  relationshipLabel: string;
  sourceDocumentId?: DocRef;
  sourcePage?: number;
}

export interface RawGraphRecords {
  people: LeanPerson[];
  evidence: LeanEvidence[];
  contradictions: LeanContradiction[];
  missingInfo: LeanMissingInfo[];
  edges: LeanGraphEdge[];
}

const nodeId = (type: VisibleGraphNodeType, id: Types.ObjectId | string) => `${type}:${String(id)}`;

/**
 * Pure assembly — takes already-fetched lean records and shapes them into
 * the exact `{ nodes[], edges[] }` payload the React Flow canvas needs.
 * Kept separate from the DB query layer so the shaping logic is testable
 * without touching Mongo.
 */
export function buildNodesAndEdges(records: RawGraphRecords): {
  nodes: GraphNodeResponse[];
  edges: GraphEdgeResponse[];
} {
  const nodes: GraphNodeResponse[] = [];
  const knownNodeIds = new Set<string>();

  for (const p of records.people) {
    const id = nodeId("person", p._id);
    knownNodeIds.add(id);
    nodes.push({
      id,
      type: "person",
      label: p.content,
      description: p.content,
      personRole: p.personRole,
      source: {
        documentId: String(p.sourceDocumentId._id),
        documentName: p.sourceDocumentId.originalFilename,
        page: p.sourcePage,
        excerpt: p.sourceExcerpt,
      },
    });
  }

  for (const e of records.evidence) {
    const id = nodeId("evidence", e._id);
    knownNodeIds.add(id);
    nodes.push({
      id,
      type: "evidence",
      label: e.content,
      description: e.content,
      source: {
        documentId: String(e.sourceDocumentId._id),
        documentName: e.sourceDocumentId.originalFilename,
        page: e.sourcePage,
        excerpt: e.sourceExcerpt,
      },
    });
  }

  for (const c of records.contradictions) {
    const id = nodeId("contradiction", c._id);
    knownNodeIds.add(id);
    nodes.push({
      id,
      type: "contradiction",
      label: c.description,
      description: c.description,
      whyFlagged: c.whyFlagged,
      sourceA: {
        documentId: String(c.sourceA.documentId._id),
        documentName: c.sourceA.documentId.originalFilename,
        page: c.sourceA.page,
        excerpt: c.sourceA.excerpt,
      },
      sourceB: {
        documentId: String(c.sourceB.documentId._id),
        documentName: c.sourceB.documentId.originalFilename,
        page: c.sourceB.page,
        excerpt: c.sourceB.excerpt,
      },
    });
  }

  for (const m of records.missingInfo) {
    const id = nodeId("missingInfo", m._id);
    knownNodeIds.add(id);
    nodes.push({
      id,
      type: "missingInfo",
      label: m.title,
      description: m.description,
      actionLabel: m.actionLabel,
      source:
        m.sourceDocumentId && m.sourcePage
          ? {
              documentId: String(m.sourceDocumentId._id),
              documentName: m.sourceDocumentId.originalFilename,
              page: m.sourcePage,
              excerpt: m.sourceExcerpt ?? "",
            }
          : null,
    });
  }

  const edges: GraphEdgeResponse[] = records.edges
    .filter((e) => e.sourceType !== "fact" && e.targetType !== "fact")
    .map((e) => {
      const source = nodeId(e.sourceType as VisibleGraphNodeType, e.sourceId);
      const target = nodeId(e.targetType as VisibleGraphNodeType, e.targetId);
      const traceable = Boolean(e.sourceDocumentId && e.sourcePage);
      return {
        id: String(e._id),
        source,
        target,
        label: e.relationshipLabel,
        traceable,
        sourceCitation:
          e.sourceDocumentId && e.sourcePage
            ? {
                documentId: String(e.sourceDocumentId._id),
                documentName: e.sourceDocumentId.originalFilename,
                page: e.sourcePage,
                excerpt: "",
              }
            : undefined,
      };
    })
    // Defensive — an edge referencing a node that no longer exists (e.g. a
    // stale record from a partially-cleared previous run) is dropped
    // rather than shown as a dangling connector.
    .filter((e) => knownNodeIds.has(e.source) && knownNodeIds.has(e.target));

  return { nodes, edges };
}
