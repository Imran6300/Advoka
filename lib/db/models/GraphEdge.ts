import { Schema, model, models, Types, type Document as MongoDocument } from "mongoose";
import { GRAPH_NODE_TYPES, type GraphNodeType } from "@/lib/cases/graph-constants";

/**
 * GraphEdge — architecture §4 data model, powers the Day 5 Case Graph
 * feature. Nodes are *not* duplicated into their own collection: a node is
 * just an existing `CaseFact` (type person | evidence), `Contradiction`, or
 * `MissingInfoFlag` document. This collection only captures the
 * relationships *between* them, referenced generically via
 * (sourceType, sourceId) / (targetType, targetId) pairs so one schema
 * covers every combination without a parallel data model.
 *
 * `sourceDocumentId` / `sourcePage` are nullable: mechanically-derived
 * edges (contradiction↔person, evidence↔person on the same source page)
 * carry a real, traceable source; LLM-proposed relationship edges without
 * one are left unsourced on purpose — the graph UI renders those visibly
 * differently (dashed, lower emphasis) rather than presenting them with
 * the same confidence as a sourced edge (architecture §14).
 */
export interface IGraphEdge extends MongoDocument {
  caseId: Types.ObjectId;
  ownerId: Types.ObjectId;
  sourceType: GraphNodeType;
  sourceId: Types.ObjectId;
  targetType: GraphNodeType;
  targetId: Types.ObjectId;
  relationshipLabel: string;
  sourceDocumentId?: Types.ObjectId;
  sourcePage?: number;
  createdAt: Date;
}

const GraphEdgeSchema = new Schema<IGraphEdge>(
  {
    caseId: { type: Schema.Types.ObjectId, ref: "Case", required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sourceType: { type: String, enum: GRAPH_NODE_TYPES, required: true },
    // Not a single `ref` — sourceId points at CaseFact, Contradiction, or
    // MissingInfoFlag depending on sourceType, resolved by the app layer
    // (lib/graph/buildNodesAndEdges.ts), not by Mongoose population.
    sourceId: { type: Schema.Types.ObjectId, required: true },
    targetType: { type: String, enum: GRAPH_NODE_TYPES, required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    relationshipLabel: { type: String, required: true, trim: true },
    sourceDocumentId: { type: Schema.Types.ObjectId, ref: "Document" },
    sourcePage: { type: Number },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

GraphEdgeSchema.index({ caseId: 1, sourceType: 1, sourceId: 1 });
GraphEdgeSchema.index({ caseId: 1, targetType: 1, targetId: 1 });

export const GraphEdge = models.GraphEdge || model<IGraphEdge>("GraphEdge", GraphEdgeSchema);
