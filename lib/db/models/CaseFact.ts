import { Schema, model, models, Types, type Document as MongoDocument } from "mongoose";
import { CASE_FACT_TYPES, type CaseFactType } from "@/lib/cases/analysis-constants";

export interface ICaseFact extends MongoDocument {
  caseId: Types.ObjectId;
  ownerId: Types.ObjectId;
  type: CaseFactType;
  content: string;
  // Optional sub-label for `type: person` (e.g. "Witness", "Accused") — the
  // Case Graph's Person node styling (Day 5) reads this too.
  personRole?: string;
  sourceDocumentId: Types.ObjectId;
  sourcePage: number;
  // Not in the original schema sketch, but required by §10 Citation UX
  // ("Document name / Page number / Short source excerpt") — every citation
  // in the app shows the actual excerpt text, not just a page reference.
  sourceExcerpt: string;
  createdAt: Date;
}

const CaseFactSchema = new Schema<ICaseFact>(
  {
    caseId: { type: Schema.Types.ObjectId, ref: "Case", required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: CASE_FACT_TYPES, required: true },
    content: { type: String, required: true },
    personRole: { type: String },
    // Every extracted claim must carry documentId + pageNumber or it's
    // dropped before it ever reaches this collection (build plan
    // non-negotiable) — enforced in lib/ai/analysisValidation.ts.
    sourceDocumentId: { type: Schema.Types.ObjectId, ref: "Document", required: true },
    sourcePage: { type: Number, required: true },
    sourceExcerpt: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

CaseFactSchema.index({ caseId: 1, type: 1 });

export const CaseFact = models.CaseFact || model<ICaseFact>("CaseFact", CaseFactSchema);
