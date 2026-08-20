import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { Case, type ICase } from "@/lib/db/models/Case";
import { CaseFact, type ICaseFact } from "@/lib/db/models/CaseFact";
import { Contradiction, type IContradiction } from "@/lib/db/models/Contradiction";
import { MissingInfoFlag, type IMissingInfoFlag } from "@/lib/db/models/MissingInfoFlag";
import { TimelineEvent, type ITimelineEvent } from "@/lib/db/models/TimelineEvent";
import { Deadline, type IDeadline } from "@/lib/db/models/Deadline";
import { GraphEdge } from "@/lib/db/models/GraphEdge";
import type { IUser } from "@/lib/db/models/User";
import type { AnalysisStepKey, StepState } from "@/lib/cases/analysis-constants";
import { initialAnalysisSteps } from "@/lib/cases/analysis-constants";
import type {
  CaseAnalysisResponse,
  CitationRef,
  FactItemResponse,
} from "@/lib/cases/analysis-types";

/**
 * Every function here takes the resolved `owner` (or an owner/case id pair
 * already verified via getCaseForOwner) and scopes every query to
 * `{ ownerId, caseId }` — never trust a client-supplied id (build plan
 * non-negotiable).
 */

// ---- Analysis progress (Case.analysis) ----------------------------------

export async function startCaseAnalysis(caseId: Types.ObjectId | string) {
  await connectDB();
  await Case.updateOne(
    { _id: caseId },
    {
      $set: {
        status: "processing",
        "analysis.status": "processing",
        "analysis.steps": initialAnalysisSteps(),
        "analysis.error": undefined,
        "analysis.startedAt": new Date(),
        "analysis.completedAt": undefined,
      },
    }
  );
}

export async function setAnalysisStep(
  caseId: Types.ObjectId | string,
  step: AnalysisStepKey,
  state: StepState
) {
  await connectDB();
  await Case.updateOne({ _id: caseId }, { $set: { [`analysis.steps.${step}`]: state } });
}

export async function completeCaseAnalysis(caseId: Types.ObjectId | string, summary: string) {
  await connectDB();
  await Case.updateOne(
    { _id: caseId },
    {
      $set: {
        "analysis.status": "ready",
        "analysis.summary": summary,
        "analysis.completedAt": new Date(),
      },
    }
  );
}

export async function failCaseAnalysis(caseId: Types.ObjectId | string, error: string) {
  await connectDB();
  await Case.updateOne(
    { _id: caseId },
    { $set: { status: "draft", "analysis.status": "failed", "analysis.error": error } }
  );
}

// ---- Facts / people / evidence -------------------------------------------

export interface NewCaseFact {
  caseId: Types.ObjectId | string;
  ownerId: Types.ObjectId | string;
  type: "fact" | "person" | "evidence";
  content: string;
  personRole?: string;
  sourceDocumentId: string;
  sourcePage: number;
  sourceExcerpt: string;
}

export async function insertCaseFacts(facts: NewCaseFact[]) {
  if (facts.length === 0) return;
  await connectDB();
  await CaseFact.insertMany(facts);
}

export async function listCaseFacts(owner: IUser, caseId: string) {
  await connectDB();
  return CaseFact.find({ caseId, ownerId: owner._id })
    .sort({ createdAt: 1 })
    .populate("sourceDocumentId", "originalFilename")
    .lean<Array<ICaseFact & { sourceDocumentId: { _id: Types.ObjectId; originalFilename: string } }>>();
}

// ---- Contradictions --------------------------------------------------------

export interface NewContradiction {
  caseId: Types.ObjectId | string;
  ownerId: Types.ObjectId | string;
  description: string;
  whyFlagged: string;
  sourceA: { documentId: string; page: number; excerpt: string };
  sourceB: { documentId: string; page: number; excerpt: string };
}

export async function insertContradictions(items: NewContradiction[]) {
  if (items.length === 0) return;
  await connectDB();
  await Contradiction.insertMany(items);
}

export async function listContradictions(owner: IUser, caseId: string) {
  await connectDB();
  return Contradiction.find({ caseId, ownerId: owner._id })
    .sort({ createdAt: 1 })
    .populate("sourceA.documentId", "originalFilename")
    .populate("sourceB.documentId", "originalFilename")
    .lean<
      Array<
        IContradiction & {
          sourceA: { documentId: { _id: Types.ObjectId; originalFilename: string }; page: number; excerpt: string };
          sourceB: { documentId: { _id: Types.ObjectId; originalFilename: string }; page: number; excerpt: string };
        }
      >
    >();
}

// ---- Missing information ---------------------------------------------------

export interface NewMissingInfoFlag {
  caseId: Types.ObjectId | string;
  ownerId: Types.ObjectId | string;
  title: string;
  description: string;
  actionLabel: string;
  sourceDocumentId?: string;
  sourcePage?: number;
  sourceExcerpt?: string;
}

export async function insertMissingInfoFlags(items: NewMissingInfoFlag[]) {
  if (items.length === 0) return;
  await connectDB();
  await MissingInfoFlag.insertMany(items);
}

export async function listMissingInfoFlags(owner: IUser, caseId: string) {
  await connectDB();
  return MissingInfoFlag.find({ caseId, ownerId: owner._id })
    .sort({ createdAt: 1 })
    .populate("sourceDocumentId", "originalFilename")
    .lean<
      Array<
        IMissingInfoFlag & {
          sourceDocumentId?: { _id: Types.ObjectId; originalFilename: string };
        }
      >
    >();
}

// ---- Timeline ---------------------------------------------------------------

export interface NewTimelineEvent {
  caseId: Types.ObjectId | string;
  ownerId: Types.ObjectId | string;
  date?: Date;
  description: string;
  sourceDocumentId: string;
  sourcePage: number;
  sourceExcerpt: string;
}

export async function insertTimelineEvents(items: NewTimelineEvent[]) {
  if (items.length === 0) return;
  await connectDB();
  await TimelineEvent.insertMany(items);
}

export async function listTimelineEvents(owner: IUser, caseId: string) {
  await connectDB();
  const events = await TimelineEvent.find({ caseId, ownerId: owner._id })
    .populate("sourceDocumentId", "originalFilename")
    .lean<
      Array<
        ITimelineEvent & { sourceDocumentId: { _id: Types.ObjectId; originalFilename: string } }
      >
    >();

  // Dated events chronologically first, undated events after (in insertion order).
  return events.sort((a, b) => {
    if (a.date && b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (a.date && !b.date) return -1;
    if (!a.date && b.date) return 1;
    return 0;
  });
}

// ---- Deadlines ---------------------------------------------------------------

export interface NewDeadline {
  caseId: Types.ObjectId | string;
  ownerId: Types.ObjectId | string;
  description: string;
  dueDate: Date;
  sourceDocumentId: string;
  sourcePage: number;
  sourceExcerpt: string;
}

export async function insertDeadlines(items: NewDeadline[]) {
  if (items.length === 0) return;
  await connectDB();
  await Deadline.insertMany(items);
}

export async function listDeadlines(owner: IUser, caseId: string) {
  await connectDB();
  return Deadline.find({ caseId, ownerId: owner._id })
    .sort({ dueDate: 1 })
    .populate("sourceDocumentId", "originalFilename")
    .lean<Array<IDeadline & { sourceDocumentId: { _id: Types.ObjectId; originalFilename: string } }>>();
}

// ---- Aggregate stats update after analysis completes -----------------------

export async function recalculateCaseAnalysisStats(caseId: Types.ObjectId | string) {
  await connectDB();
  const [keyFactsCount, contradictionsCount, missingInfoCount, deadlinesCount] = await Promise.all([
    CaseFact.countDocuments({ caseId }),
    Contradiction.countDocuments({ caseId }),
    MissingInfoFlag.countDocuments({ caseId }),
    Deadline.countDocuments({ caseId }),
  ]);

  await Case.updateOne(
    { _id: caseId },
    {
      $set: {
        "stats.keyFactsCount": keyFactsCount,
        "stats.contradictionsCount": contradictionsCount,
        "stats.missingInfoCount": missingInfoCount,
        "stats.deadlinesCount": deadlinesCount,
      },
    }
  );
}

/** Clears any previously-generated analysis output — used when Analyze is re-run. */
export async function clearCaseAnalysisOutput(caseId: Types.ObjectId | string) {
  await connectDB();
  await Promise.all([
    CaseFact.deleteMany({ caseId }),
    Contradiction.deleteMany({ caseId }),
    MissingInfoFlag.deleteMany({ caseId }),
    TimelineEvent.deleteMany({ caseId }),
    Deadline.deleteMany({ caseId }),
    GraphEdge.deleteMany({ caseId }),
  ]);
}

export async function getCaseWithAnalysis(owner: IUser, caseId: string): Promise<ICase | null> {
  await connectDB();
  if (!Types.ObjectId.isValid(caseId)) return null;
  return Case.findOne({ _id: caseId, ownerId: owner._id }).lean<ICase>();
}

// ---- Full shaped response for the Overview tab / analysis polling hook -----

function toCitation(doc: { _id: Types.ObjectId; originalFilename: string } | undefined | null, page: number, excerpt: string): CitationRef | null {
  if (!doc) return null;
  return {
    documentId: String(doc._id),
    documentName: doc.originalFilename,
    page,
    excerpt,
  };
}

/**
 * Assembles the full `CaseAnalysisResponse` — everything the Overview tab
 * and the analysis-polling hook need in one round trip. Facts are split
 * into fact/person/evidence buckets here so the UI doesn't have to filter
 * client-side.
 */
export async function getCaseAnalysisResponse(
  owner: IUser,
  caseId: string
): Promise<CaseAnalysisResponse | null> {
  const caseRecord = await getCaseWithAnalysis(owner, caseId);
  if (!caseRecord) return null;

  const [facts, contradictions, missingInfo, timeline, deadlines] = await Promise.all([
    listCaseFacts(owner, caseId),
    listContradictions(owner, caseId),
    listMissingInfoFlags(owner, caseId),
    listTimelineEvents(owner, caseId),
    listDeadlines(owner, caseId),
  ]);

  const shapedFacts: FactItemResponse[] = facts
    .map((f): FactItemResponse | null => {
      const source = toCitation(f.sourceDocumentId, f.sourcePage, f.sourceExcerpt);
      if (!source) return null;
      return {
        _id: String(f._id),
        type: f.type,
        content: f.content,
        personRole: f.personRole,
        source,
      };
    })
    .filter((f): f is FactItemResponse => f !== null);

  return {
    status: caseRecord.analysis?.status ?? "not_started",
    steps: caseRecord.analysis?.steps ?? initialAnalysisSteps(),
    summary: caseRecord.analysis?.summary ?? null,
    error: caseRecord.analysis?.error ?? null,
    facts: shapedFacts.filter((f) => f.type === "fact"),
    evidence: shapedFacts.filter((f) => f.type === "evidence"),
    people: shapedFacts.filter((f) => f.type === "person"),
    contradictions: contradictions.map((c) => ({
      _id: String(c._id),
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
      reviewed: c.reviewed,
    })),
    missingInfo: missingInfo.map((m) => ({
      _id: String(m._id),
      title: m.title,
      description: m.description,
      actionLabel: m.actionLabel,
      source:
        m.sourceDocumentId && m.sourcePage
          ? toCitation(m.sourceDocumentId, m.sourcePage, m.sourceExcerpt ?? "")
          : null,
    })),
    timeline: timeline
      .map((t) => {
        const source = toCitation(t.sourceDocumentId, t.sourcePage, t.sourceExcerpt);
        if (!source) return null;
        return {
          _id: String(t._id),
          date: t.date ? new Date(t.date).toISOString() : null,
          description: t.description,
          source,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null),
    deadlines: deadlines
      .map((d) => {
        const source = toCitation(d.sourceDocumentId, d.sourcePage, d.sourceExcerpt);
        if (!source) return null;
        return {
          _id: String(d._id),
          description: d.description,
          dueDate: new Date(d.dueDate).toISOString(),
          source,
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null),
  };
}
