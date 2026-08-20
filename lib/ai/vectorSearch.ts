import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { DocumentChunk } from "@/lib/db/models/DocumentChunk";
import { Document } from "@/lib/db/models/Document";

// Matches scripts/createVectorIndex.ts exactly — the index this queries.
const VECTOR_INDEX_NAME = "document_chunk_vector_index";

// A cosine-similarity fallback over every chunk in the case, computed in
// Node, used whenever $vectorSearch itself fails (index not built yet,
// M0/local dev without Atlas Search, etc.) — RAG chat and drafting should
// keep working through local development rather than hard-depending on an
// Atlas feature provisioned out-of-band. Capped since it's O(n) per query;
// fine at MVP case sizes (a few hundred chunks per case, typically far less).
const FALLBACK_MAX_CHUNKS = 500;

export interface RetrievedChunk {
  documentId: string;
  documentName: string;
  pageNumber: number;
  text: string;
}

async function nameMapForDocuments(documentIds: Types.ObjectId[]): Promise<Map<string, string>> {
  if (documentIds.length === 0) return new Map();
  const docs = await Document.find({ _id: { $in: documentIds } })
    .select("_id originalFilename")
    .lean<Array<{ _id: Types.ObjectId; originalFilename: string }>>();
  return new Map(docs.map((d) => [String(d._id), d.originalFilename]));
}

function cosineSimilarity(a: number[], b: number[]): number {
  // Both vectors are already L2-normalized by lib/ai/embeddings.ts, so the
  // dot product alone equals cosine similarity — no need to divide by norms.
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

async function fallbackSearch(
  caseId: string,
  ownerId: Types.ObjectId | string,
  queryEmbedding: number[],
  topK: number
): Promise<RetrievedChunk[]> {
  const chunks = await DocumentChunk.find({ caseId, ownerId })
    .select("documentId pageNumber text embedding")
    .limit(FALLBACK_MAX_CHUNKS)
    .lean<Array<{ documentId: Types.ObjectId; pageNumber: number; text: string; embedding: number[] }>>();

  if (chunks.length === 0) return [];

  const nameMap = await nameMapForDocuments([...new Set(chunks.map((c) => c.documentId))]);

  return chunks
    .map((c) => ({ c, score: cosineSimilarity(queryEmbedding, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ c }) => ({
      documentId: String(c.documentId),
      documentName: nameMap.get(String(c.documentId)) ?? "Untitled document",
      pageNumber: c.pageNumber,
      text: c.text,
    }));
}

/**
 * architecture §7 RAG: embed the question, `$vectorSearch` against
 * `DocumentChunk` filtered by `caseId` + `ownerId`, top-k ~6–10. Falls back
 * to an in-app cosine-similarity scan if Atlas Vector Search itself isn't
 * available (index not created, non-Atlas connection) rather than failing
 * the whole feature — the filter (`caseId`/`ownerId`) is identical either
 * way, so no cross-case or cross-lawyer data ever leaks into the fallback.
 */
export async function searchCaseChunks(
  caseId: string,
  ownerId: Types.ObjectId | string,
  queryEmbedding: number[],
  topK = 8
): Promise<RetrievedChunk[]> {
  await connectDB();

  try {
    const results = await DocumentChunk.aggregate<{
      documentId: Types.ObjectId;
      pageNumber: number;
      text: string;
    }>([
      {
        $vectorSearch: {
          index: VECTOR_INDEX_NAME,
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: Math.max(topK * 15, 100),
          limit: topK,
          filter: {
            caseId: new Types.ObjectId(caseId),
            ownerId: new Types.ObjectId(typeof ownerId === "string" ? ownerId : ownerId.toString()),
          },
        },
      },
      { $project: { documentId: 1, pageNumber: 1, text: 1 } },
    ]);

    if (results.length > 0) {
      const nameMap = await nameMapForDocuments([...new Set(results.map((r) => r.documentId))]);
      return results.map((r) => ({
        documentId: String(r.documentId),
        documentName: nameMap.get(String(r.documentId)) ?? "Untitled document",
        pageNumber: r.pageNumber,
        text: r.text,
      }));
    }

    // Zero results from a working index is a legitimate answer (nothing
    // relevant), not a failure — only fall back on a thrown error below.
    return [];
  } catch {
    return fallbackSearch(caseId, ownerId, queryEmbedding, topK);
  }
}
