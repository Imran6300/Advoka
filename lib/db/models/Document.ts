import { Schema, model, models, Types, type Document as MongoDocument } from "mongoose";

export const DOCUMENT_STATUSES = ["uploaded", "extracting", "extracted", "failed"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export interface IDocument extends MongoDocument {
  caseId: Types.ObjectId;
  ownerId: Types.ObjectId;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  storageUrl: string; // Supabase Storage object path
  status: DocumentStatus;
  pageCount?: number;
  // Not in the original schema sketch, but required to satisfy §23 Error
  // handling — a specific, non-technical message shown next to "Try Again",
  // never a raw stack trace.
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    caseId: { type: Schema.Types.ObjectId, ref: "Case", required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    originalFilename: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    storageUrl: { type: String, required: true },
    status: { type: String, enum: DOCUMENT_STATUSES, default: "uploaded" },
    pageCount: { type: Number },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

DocumentSchema.index({ caseId: 1, createdAt: -1 });

export const Document = models.Document || model<IDocument>("Document", DocumentSchema);
