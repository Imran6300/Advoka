import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { DocumentChunk } from "@/lib/db/models/DocumentChunk";
import { Document } from "@/lib/db/models/Document";

// Groq's free-tier Llama 3.3 70B context is generous (128k tokens), but
// this is still a zero-cost MVP — keep prompts fast and cheap rather than
// stuffing the full context window every analysis run.
const MAX_CONTEXT_CHARS = 30000;

export interface KnownDocument {
  id: string;
  name: string;
}

export interface CaseAnalysisContext {
  /** Formatted, citation-ready text block to paste directly into a prompt. */
  contextBlock: string;
  /** Every document the model is allowed to cite — used to validate output. */
  documents: KnownDocument[];
  totalChunks: number;
}

/**
 * Pulls every DocumentChunk for a case, tags each with its real document
 * name/id/page, and round-robins across documents while building the
 * context block so every document gets some representation even under the
 * character budget — a naive "first N chars" approach would starve any
 * document that wasn't uploaded first.
 */
export async function buildCaseAnalysisContext(
  caseId: string,
  ownerId: Types.ObjectId | string
): Promise<CaseAnalysisContext> {
  await connectDB();

  const [chunks, documents] = await Promise.all([
    DocumentChunk.find({ caseId, ownerId })
      .sort({ documentId: 1, pageNumber: 1 })
      .lean<Array<{ documentId: Types.ObjectId; pageNumber: number; text: string }>>(),
    Document.find({ caseId, ownerId, status: "extracted" })
      .select("_id originalFilename")
      .lean<Array<{ _id: Types.ObjectId; originalFilename: string }>>(),
  ]);

  const nameById = new Map(documents.map((d) => [String(d._id), d.originalFilename]));

  const byDocument = new Map<string, Array<{ pageNumber: number; text: string }>>();
  for (const chunk of chunks) {
    const docId = String(chunk.documentId);
    if (!nameById.has(docId)) continue; // defensive — skip chunks for documents that failed after indexing
    const list = byDocument.get(docId) ?? [];
    list.push({ pageNumber: chunk.pageNumber, text: chunk.text });
    byDocument.set(docId, list);
  }

  const queues = Array.from(byDocument.entries()).map(([documentId, docChunks]) => ({
    documentId,
    name: nameById.get(documentId) ?? "Untitled document",
    queue: docChunks,
  }));

  const parts: string[] = [];
  let totalChars = 0;
  let exhausted = false;

  while (!exhausted && totalChars < MAX_CONTEXT_CHARS) {
    exhausted = true;
    for (const doc of queues) {
      if (doc.queue.length === 0) continue;
      exhausted = false;
      const chunk = doc.queue.shift()!;
      const block = `[Document: ${doc.name} | documentId: ${doc.documentId} | Page ${chunk.pageNumber}]\n${chunk.text}\n`;
      parts.push(block);
      totalChars += block.length;
      if (totalChars >= MAX_CONTEXT_CHARS) break;
    }
  }

  return {
    contextBlock: parts.join("\n"),
    documents: documents.map((d) => ({ id: String(d._id), name: d.originalFilename })),
    totalChunks: chunks.length,
  };
}
