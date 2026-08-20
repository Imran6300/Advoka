import { Schema, model, models, Types, type Document as MongoDocument } from "mongoose";

export interface IChatCitation {
  documentId: Types.ObjectId;
  // Not in the original schema sketch, but every citation in the app
  // renders through the shared Citation component (§10), which needs the
  // document name at render time — denormalized here the same way
  // CaseFact/Contradiction/etc. carry sourceExcerpt, rather than requiring
  // a populate() on every chat history read.
  documentName: string;
  page: number;
  excerpt: string;
}

export interface IChatMessage extends MongoDocument {
  caseId: Types.ObjectId;
  ownerId: Types.ObjectId;
  role: "user" | "assistant";
  content: string;
  citations: IChatCitation[];
  createdAt: Date;
}

const ChatCitationSchema = new Schema<IChatCitation>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true },
    documentName: { type: String, required: true },
    page: { type: Number, required: true },
    excerpt: { type: String, required: true },
  },
  { _id: false }
);

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    caseId: { type: Schema.Types.ObjectId, ref: "Case", required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    // Empty for user messages — only assistant answers carry citations
    // (build plan non-negotiable: every AI claim needs a documentId +
    // pageNumber or it's dropped before it's ever stored here).
    citations: { type: [ChatCitationSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ChatMessageSchema.index({ caseId: 1, createdAt: 1 });

export const ChatMessage = models.ChatMessage || model<IChatMessage>("ChatMessage", ChatMessageSchema);
