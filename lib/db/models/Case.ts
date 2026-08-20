import { Schema, model, models, Types, type Document as MongoDocument } from "mongoose";
import { CASE_STATUSES, type CaseStatus } from "@/lib/cases/constants";
import {
  ANALYSIS_STATUSES,
  STEP_STATES,
  initialAnalysisSteps,
  type AnalysisStatus,
  type AnalysisSteps,
} from "@/lib/cases/analysis-constants";

export interface ICaseStats {
  documentsCount: number;
  keyFactsCount: number;
  contradictionsCount: number;
  missingInfoCount: number;
  deadlinesCount: number;
}

// Not in the original schema sketch — the build plan's "meaningful progress
// checklist" (§9) and the expandable AI summary (§7 Overview → AI case
// summary) both need somewhere to live between Inngest steps and client
// polling, so they're tracked directly on Case rather than a new collection.
export interface ICaseAnalysis {
  status: AnalysisStatus;
  steps: AnalysisSteps;
  summary?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
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
  analysis: ICaseAnalysis;
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

const stepField = { type: String, enum: STEP_STATES, default: "pending" } as const;

const CaseAnalysisStepsSchema = new Schema<AnalysisSteps>(
  {
    documentsReceived: stepField,
    textExtracted: stepField,
    documentsIndexed: stepField,
    findingFacts: stepField,
    detectingContradictions: stepField,
    buildingTimeline: stepField,
  },
  { _id: false }
);

const CaseAnalysisSchema = new Schema<ICaseAnalysis>(
  {
    status: { type: String, enum: ANALYSIS_STATUSES, default: "not_started" },
    steps: { type: CaseAnalysisStepsSchema, default: () => initialAnalysisSteps() },
    summary: { type: String },
    error: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
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
    analysis: {
      type: CaseAnalysisSchema,
      default: () => ({ status: "not_started", steps: initialAnalysisSteps() }),
    },
  },
  { timestamps: true }
);

// Dashboard/case-list queries always sort a lawyer's own cases by recency.
CaseSchema.index({ ownerId: 1, updatedAt: -1 });

export const Case = models.Case || model<ICase>("Case", CaseSchema);
