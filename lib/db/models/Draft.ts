import { Schema, model, models, Types, type Document as MongoDocument } from "mongoose";
import {
  DRAFT_TEMPLATE_TYPES,
  DRAFT_STATUSES,
  type DraftTemplateType,
  type DraftStatus,
} from "@/lib/cases/analysis-constants";

export type { DraftStatus };

export interface IDraft extends MongoDocument {
  caseId: Types.ObjectId;
  ownerId: Types.ObjectId;
  templateType: DraftTemplateType;
  instructions: string;
  content: string;
  // Not in the original schema sketch — generation runs through Inngest
  // (architecture §3 event list: `draft.generate.requested`, same
  // "heavy work never runs inline" discipline as analysis/graph), so the
  // Drafting UI's "Generate → Review" step needs somewhere to poll against
  // while the job is in flight.
  status: DraftStatus;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DraftSchema = new Schema<IDraft>(
  {
    caseId: { type: Schema.Types.ObjectId, ref: "Case", required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    templateType: { type: String, enum: DRAFT_TEMPLATE_TYPES, required: true },
    instructions: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
    status: { type: String, enum: DRAFT_STATUSES, default: "pending" },
    error: { type: String },
  },
  { timestamps: true }
);

DraftSchema.index({ caseId: 1, createdAt: -1 });

export const Draft = models.Draft || model<IDraft>("Draft", DraftSchema);
