import { Schema, model, models, Types, type Document as MongoDocument } from "mongoose";
import { CASE_STATUSES, type CaseStatus } from "@/lib/cases/constants";

export interface ICaseStats {
  documentsCount: number;
  keyFactsCount: number;
  contradictionsCount: number;
  missingInfoCount: number;
  deadlinesCount: number;
}

export interface ICase extends MongoDocument {
  ownerId: Types.ObjectId;
  title: string;
  caseType: string;
  clientName: string;
  opposingParty?: string;
  importantDate?: Date;
  status: CaseStatus;
  stats: ICaseStats;
  createdAt: Date;
  updatedAt: Date;
}

const CaseStatsSchema = new Schema<ICaseStats>(
  {
    documentsCount: { type: Number, default: 0 },
    keyFactsCount: { type: Number, default: 0 },
    contradictionsCount: { type: Number, default: 0 },
    missingInfoCount: { type: Number, default: 0 },
    deadlinesCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const CaseSchema = new Schema<ICase>(
  {
    // Every query must filter on ownerId — never trust a client-supplied id
    // (build plan non-negotiable, enforced in lib/db/queries/cases.ts).
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    caseType: { type: String, required: true, trim: true },
    clientName: { type: String, required: true, trim: true },
    opposingParty: { type: String, trim: true },
    importantDate: { type: Date },
    status: { type: String, enum: CASE_STATUSES, default: "draft" },
    stats: {
      type: CaseStatsSchema,
      default: () => ({
        documentsCount: 0,
        keyFactsCount: 0,
        contradictionsCount: 0,
        missingInfoCount: 0,
        deadlinesCount: 0,
      }),
    },
  },
  { timestamps: true }
);

// Dashboard/case-list queries always sort a lawyer's own cases by recency.
CaseSchema.index({ ownerId: 1, updatedAt: -1 });

export const Case = models.Case || model<ICase>("Case", CaseSchema);
