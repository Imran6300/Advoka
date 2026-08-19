import { Schema, model, models, Types, type Document as MongoDocument } from "mongoose";

export interface IDocumentChunk extends MongoDocument {
  documentId: Types.ObjectId;
  caseId: Types.ObjectId;
  ownerId: Types.ObjectId;
  pageNumber: number;
  text: string;
  embedding: number[];
  createdAt: Date;
}

const DocumentChunkSchema = new Schema<IDocumentChunk>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    caseId: { type: Schema.Types.ObjectId, ref: "Case", required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    pageNumber: { type: Number, required: true },
    text: { type: String, required: true },
    // 384-dim — output of the quantized all-MiniLM-L6-v2 model used in
    // lib/ai/embeddings.ts. The Atlas Vector Search index itself is created
    // out-of-band against a real cluster — see scripts/createVectorIndex.ts.
    embedding: { type: [Number], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

DocumentChunkSchema.index({ caseId: 1, documentId: 1 });

export const DocumentChunk =
  models.DocumentChunk || model<IDocumentChunk>("DocumentChunk", DocumentChunkSchema);
