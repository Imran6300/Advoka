import { Schema, model, models, Types, type Document as MongoDocument } from "mongoose";

export interface IMissingInfoFlag extends MongoDocument {
  caseId: Types.ObjectId;
  ownerId: Types.ObjectId;
  // §14 Missing information UI requires four distinct fields per item
  // ("What is missing" / "Why it matters" / "Source that caused the flag" /
  // "Action") — the architecture's bare `description` field is expanded
  // into these explicitly rather than packing them into one string.
  title: string; // "What is missing"
  description: string; // "Why it matters"
  actionLabel: string; // e.g. "Upload referenced document"
  // Nullable — some gaps (e.g. "date unclear") are flagged from the
  // document that raised the question, but others are a general absence
  // with no single page to point at.
  sourceDocumentId?: Types.ObjectId;
  sourcePage?: number;
  sourceExcerpt?: string;
  createdAt: Date;
}

const MissingInfoFlagSchema = new Schema<IMissingInfoFlag>(
  {
    caseId: { type: Schema.Types.ObjectId, ref: "Case", required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    actionLabel: { type: String, required: true },
    sourceDocumentId: { type: Schema.Types.ObjectId, ref: "Document" },
    sourcePage: { type: Number },
    sourceExcerpt: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

MissingInfoFlagSchema.index({ caseId: 1, createdAt: -1 });

export const MissingInfoFlag =
  models.MissingInfoFlag || model<IMissingInfoFlag>("MissingInfoFlag", MissingInfoFlagSchema);
