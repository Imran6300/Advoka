import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { Document, type IDocument } from "@/lib/db/models/Document";
import { DocumentChunk } from "@/lib/db/models/DocumentChunk";
import { Case } from "@/lib/db/models/Case";
import type { IUser } from "@/lib/db/models/User";
import { inngest } from "@/inngest/client";

/**
 * Every function takes the resolved `owner` and scopes every query to
 * `{ ownerId, caseId }` — never trust a client-supplied id (build plan
 * non-negotiable). Callers must first resolve the parent case via
 * getCaseForOwner() so a documentId can't be probed across cases either.
 */

export interface CreateDocumentInput {
  caseId: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  storageUrl: string;
}

export async function createDocumentForOwner(owner: IUser, input: CreateDocumentInput) {
  await connectDB();
  const doc = await Document.create({
    ownerId: owner._id,
    caseId: input.caseId,
    originalFilename: input.originalFilename,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    storageUrl: input.storageUrl,
    status: "uploaded",
  });

  // §Bugfix — this used to flip Case.status to "processing" the instant
  // *any* document was uploaded, regardless of whether analysis had even
  // been triggered. That made the badge lie: a case sat on "Processing"
  // indefinitely just because a file existed, even while extraction was
  // done and analysis hadn't started (and nothing auto-starts it — the
  // lawyer has to click "Analyze this case"). "Processing" now means what
  // it says: analysis or graph-build is actually running
  // (see startCaseAnalysis in lib/db/queries/analysis.ts, the only other
  // place Case.status changes). A case with uploaded-but-unanalyzed
  // documents correctly shows "Draft" until the lawyer chooses to analyze.

  // Heavy work (extraction/embedding) always runs through Inngest, never
  // inline in an API route (build plan non-negotiable).
  await inngest.send({
    name: "document.uploaded",
    data: {
      documentId: String(doc._id),
      caseId: String(input.caseId),
      ownerId: String(owner._id),
    },
  });

  return doc;
}

export async function listDocumentsForCase(owner: IUser, caseId: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(caseId)) return [];
  return Document.find({ caseId, ownerId: owner._id })
    .sort({ createdAt: -1 })
    .lean<IDocument[]>();
}

export async function getDocumentForOwner(owner: IUser, caseId: string, documentId: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(documentId)) return null;
  return Document.findOne({ _id: documentId, caseId, ownerId: owner._id });
}

/**
 * Used inside the Inngest pipeline, where documentId/caseId/ownerId come
 * from an event *we* fired server-side (see createDocumentForOwner), not
 * from a client request — but we still scope the lookup to all three so a
 * malformed or replayed event can't touch the wrong document.
 */
export async function getDocumentByEventRef(ref: {
  documentId: string;
  caseId: string;
  ownerId: string;
}) {
  await connectDB();
  return Document.findOne({ _id: ref.documentId, caseId: ref.caseId, ownerId: ref.ownerId });
}

/**
 * Recomputes Case.stats.documentsCount from documents that finished
 * extraction successfully — "Documents processed" on the dashboard means
 * documents Advoka actually got usable text out of, not just uploaded.
 */
export async function recalculateCaseDocumentStats(caseId: Types.ObjectId | string) {
  await connectDB();
  const documentsCount = await Document.countDocuments({ caseId, status: "extracted" });
  await Case.updateOne({ _id: caseId }, { $set: { "stats.documentsCount": documentsCount } });
}

export async function markDocumentExtracting(documentId: Types.ObjectId | string) {
  await connectDB();
  await Document.updateOne({ _id: documentId }, { $set: { status: "extracting", errorMessage: undefined } });
}

export async function markDocumentExtracted(
  documentId: Types.ObjectId | string,
  pageCount: number
) {
  await connectDB();
  await Document.updateOne(
    { _id: documentId },
    { $set: { status: "extracted", pageCount, errorMessage: undefined } }
  );
}

export async function markDocumentFailed(documentId: Types.ObjectId | string, errorMessage: string) {
  await connectDB();
  await Document.updateOne({ _id: documentId }, { $set: { status: "failed", errorMessage } });
}

export async function deleteChunksForDocument(documentId: Types.ObjectId | string) {
  await connectDB();
  await DocumentChunk.deleteMany({ documentId });
}

export async function insertDocumentChunks(
  chunks: Array<{
    documentId: Types.ObjectId | string;
    caseId: Types.ObjectId | string;
    ownerId: Types.ObjectId | string;
    pageNumber: number;
    text: string;
    embedding: number[];
  }>
) {
  if (chunks.length === 0) return;
  await connectDB();
  await DocumentChunk.insertMany(chunks);
}

