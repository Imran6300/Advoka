import { Schema, model, models, Types, type Document as MongoDocument } from "mongoose";

export interface IDeadline extends MongoDocument {
  caseId: Types.ObjectId;
  ownerId: Types.ObjectId;
  description: string;
  dueDate: Date;
  sourceDocumentId: Types.ObjectId;
  sourcePage: number;
  sourceExcerpt: string;
  createdAt: Date;
}

const DeadlineSchema = new Schema<IDeadline>(
  {
    caseId: { type: Schema.Types.ObjectId, ref: "Case", required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    description: { type: String, required: true },
    dueDate: { type: Date, required: true },
    sourceDocumentId: { type: Schema.Types.ObjectId, ref: "Document", required: true },
    sourcePage: { type: Number, required: true },
    sourceExcerpt: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// §15 Deadlines — emerald/amber/rose status is derived from `dueDate` at
// render time (lib/cases/deadline-status.ts), not stored, since there's no
// "mark complete" action in the MVP yet.
DeadlineSchema.index({ caseId: 1, dueDate: 1 });

export const Deadline = models.Deadline || model<IDeadline>("Deadline", DeadlineSchema);
