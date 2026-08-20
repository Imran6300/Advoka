import { Schema, model, models, Types, type Document as MongoDocument } from "mongoose";

export interface IContradictionSource {
  documentId: Types.ObjectId;
  page: number;
  excerpt: string;
}

export interface IContradiction extends MongoDocument {
  caseId: Types.ObjectId;
  ownerId: Types.ObjectId;
  description: string;
  // Not in the original schema sketch — §13 Contradiction UI requires a
  // "Why Advoka flagged this" explanation shown alongside the two sources,
  // and explicitly warns the AI must never present a disputed
  // interpretation as an established fact, so this stays a separate,
  // clearly-labeled field rather than folded into `description`.
  whyFlagged: string;
  sourceA: IContradictionSource;
  sourceB: IContradictionSource;
  // Powers the dashboard's "unreviewed contradictions" attention section
  // (§6.2 / §29 Level 1) once that's wired up later in the build.
  reviewed: boolean;
  createdAt: Date;
}

const ContradictionSourceSchema = new Schema<IContradictionSource>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true },
    page: { type: Number, required: true },
    excerpt: { type: String, required: true },
  },
  { _id: false }
);

const ContradictionSchema = new Schema<IContradiction>(
  {
    caseId: { type: Schema.Types.ObjectId, ref: "Case", required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    description: { type: String, required: true },
    whyFlagged: { type: String, required: true },
    // No contradiction is surfaced without two verifiable anchors (build
    // plan non-negotiable) — both required, never optional.
    sourceA: { type: ContradictionSourceSchema, required: true },
    sourceB: { type: ContradictionSourceSchema, required: true },
    reviewed: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ContradictionSchema.index({ caseId: 1, createdAt: -1 });

export const Contradiction =
  models.Contradiction || model<IContradiction>("Contradiction", ContradictionSchema);
