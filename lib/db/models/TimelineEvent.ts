import { Schema, model, models, Types, type Document as MongoDocument } from "mongoose";

export interface ITimelineEvent extends MongoDocument {
  caseId: Types.ObjectId;
  ownerId: Types.ObjectId;
  date?: Date; // nullable — some events are ordered but undated in the source text
  description: string;
  sourceDocumentId: Types.ObjectId;
  sourcePage: number;
  // Extension beyond the original sketch, same reasoning as CaseFact — §10
  // Citation UX requires the excerpt itself, not just a page reference.
  sourceExcerpt: string;
  createdAt: Date;
}

const TimelineEventSchema = new Schema<ITimelineEvent>(
  {
    caseId: { type: Schema.Types.ObjectId, ref: "Case", required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date },
    description: { type: String, required: true },
    sourceDocumentId: { type: Schema.Types.ObjectId, ref: "Document", required: true },
    sourcePage: { type: Number, required: true },
    sourceExcerpt: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Chronological rendering is the whole point of this collection — undated
// events (date: null) sort last via the query layer, not the index.
TimelineEventSchema.index({ caseId: 1, date: 1 });

export const TimelineEvent =
  models.TimelineEvent || model<ITimelineEvent>("TimelineEvent", TimelineEventSchema);
