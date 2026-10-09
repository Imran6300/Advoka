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
  //
  // Bugfix — a failed inngest.send() used to throw out of here AFTER the file
  // was stored and the Document row created, so the user saw "Upload failed"
  // (500) while an orphaned "uploaded" document sat in the DB forever. The
  // most common cause in production is a missing INNGEST_EVENT_KEY. The
  // upload itself succeeded, so we keep it, flag the document as failed with
  // an actionable message, and let the existing Retry button re-send.
  try {
    await sendDocumentUploadedEvent({
      documentId: String(doc._id),
      caseId: String(input.caseId),
      ownerId: String(owner._id),
    });
  } catch (err) {
    console.error("[documents] inngest.send failed for", String(doc._id), err);
    await Document.updateOne(
      { _id: doc._id },
      {
        $set: {
          status: "failed",
          errorMessage:
            "File saved, but processing couldn't be started. Please use Retry in a moment.",
        },
      }
    );
    doc.status = "failed";
    doc.errorMessage =
      "File saved, but processing couldn't be started. Please use Retry in a moment.";
  }

  return doc;
}

export async function sendDocumentUploadedEvent(data: {
  documentId: string;
  caseId: string;
  ownerId: string;
}) {
  await inngest.send({ name: "document.uploaded", data });
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


/**
 * Idempotent per-batch chunk write, keyed on (documentId, chunkIndex). Safe if
 * an Inngest step is retried after a partial success — no duplicate chunks.
 */
export async function upsertDocumentChunks(
  chunks: Array<{
    documentId: Types.ObjectId | string;
    caseId: Types.ObjectId | string;
    ownerId: Types.ObjectId | string;
    chunkIndex: number;
    pageNumber: number;
    text: string;
    embedding: number[];
  }>
) {
  if (chunks.length === 0) return;
  await connectDB();
  await DocumentChunk.bulkWrite(
    chunks.map((c) => ({
      updateOne: {
        filter: { documentId: c.documentId, chunkIndex: c.chunkIndex },
        update: {
          $set: {
            caseId: c.caseId,
            ownerId: c.ownerId,
            pageNumber: c.pageNumber,
            text: c.text,
            embedding: c.embedding,
          },
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );
}

/**
 * Registers documents the browser already uploaded straight to storage:
 * one insertMany + ONE batched Inngest send, instead of a DB write and an
 * event round-trip per file.
 */
export async function registerUploadedDocuments(
  owner: IUser,
  caseId: string,
  items: Array<{ path: string; filename: string; mimeType: string; sizeBytes: number }>
) {
  if (items.length === 0) return [];
  await connectDB();

  const existing = await Document.find({
    ownerId: owner._id,
    caseId,
    storageUrl: { $in: items.map((i) => i.path) },
  })
    .select("storageUrl")
    .lean<Array<{ storageUrl: string }>>();
  const already = new Set(existing.map((d) => d.storageUrl));
  const fresh = items.filter((i) => !already.has(i.path)); // double-submit guard
  if (fresh.length === 0) return [];

  const docs = await Document.insertMany(
    fresh.map((i) => ({
      ownerId: owner._id,
      caseId,
      originalFilename: i.filename,
      mimeType: i.mimeType,
      sizeBytes: i.sizeBytes,
      storageUrl: i.path,
      status: "uploaded",
    }))
  );

  try {
    await inngest.send(
      docs.map((d) => ({
        name: "document.uploaded" as const,
        data: { documentId: String(d._id), caseId: String(caseId), ownerId: String(owner._id) },
      }))
    );
  } catch (err) {
    console.error("[documents] batched inngest.send failed", err);
    const message = "File saved, but processing couldn't be started. Please use Retry in a moment.";
    await Document.updateMany({ _id: { $in: docs.map((d) => d._id) } }, { $set: { status: "failed", errorMessage: message } });
    for (const d of docs) {
      d.status = "failed";
      d.errorMessage = message;
    }
  }

  return docs;
}

/**
 * Safety net: a document stuck in uploaded/extracting for far longer than any
 * real run (Inngest retries exhausted, function killed) is marked failed so
 * the UI stops spinning/polling forever and the Retry button appears.
 */
export async function failStaleDocuments(owner: IUser, caseId: string, olderThanMs = 15 * 60_000) {
  await connectDB();
  if (!Types.ObjectId.isValid(caseId)) return;
  const res = await Document.updateMany(
    {
      caseId,
      ownerId: owner._id,
      status: { $in: ["uploaded", "extracting"] },
      updatedAt: { $lt: new Date(Date.now() - olderThanMs) },
    },
    {
      $set: {
        status: "failed",
        errorMessage: "Processing took too long and was stopped. Please try again.",
      },
    }
  );
  if (res.modifiedCount > 0) await recalculateCaseDocumentStats(caseId);
}
