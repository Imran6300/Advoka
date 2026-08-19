/**
 * Creates the Atlas Vector Search index used by RAG chat (Day 6) against
 * `DocumentChunk.embedding`. Atlas Search indexes can't be created through
 * the regular Mongoose schema — they're a separate Atlas feature, created
 * either here (via the driver, Atlas M10+) or by hand in the Atlas UI on
 * the free M0 tier (Atlas Search → Create Search Index → JSON Editor).
 *
 * Run manually, once, after Day 3's pipeline has written some real chunks:
 *   npx tsx scripts/createVectorIndex.ts
 *
 * If you're on M0 (no driver-managed Search Index creation), skip this
 * script and paste the same definition into the Atlas UI instead.
 */
import "dotenv/config";
import mongoose from "mongoose";

const INDEX_NAME = "document_chunk_vector_index";
const EMBEDDING_DIMENSIONS = 384; // all-MiniLM-L6-v2 output size

const INDEX_DEFINITION = {
  name: INDEX_NAME,
  type: "vectorSearch",
  definition: {
    fields: [
      {
        type: "vector",
        path: "embedding",
        numDimensions: EMBEDDING_DIMENSIONS,
        similarity: "cosine",
      },
      // Pre-filter fields used by the RAG query ($vectorSearch filter on
      // caseId + ownerId — architecture §7).
      { type: "filter", path: "caseId" },
      { type: "filter", path: "ownerId" },
    ],
  },
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to .env.local first.");
  }

  const connection = await mongoose.createConnection(uri).asPromise();
  const collection = connection.collection("documentchunks");

  const existing = await collection.listSearchIndexes(INDEX_NAME).toArray().catch(() => []);
  if (existing.length > 0) {
    console.log(`Index "${INDEX_NAME}" already exists — nothing to do.`);
    await connection.close();
    return;
  }

  await collection.createSearchIndex(INDEX_DEFINITION);
  console.log(`Created Atlas Vector Search index "${INDEX_NAME}" on documentchunks.embedding.`);
  console.log("It may take a minute to finish building — check status in the Atlas UI.");

  await connection.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
