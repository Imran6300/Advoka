import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { ChatMessage, type IChatCitation } from "@/lib/db/models/ChatMessage";
import type { IUser } from "@/lib/db/models/User";
import type { ChatMessageResponse } from "@/lib/cases/chat-types";

const MAX_HISTORY_FOR_CONTEXT = 6;

function toResponse(msg: {
  _id: Types.ObjectId;
  role: "user" | "assistant";
  content: string;
  citations: IChatCitation[];
  createdAt: Date;
}): ChatMessageResponse {
  return {
    _id: String(msg._id),
    role: msg.role,
    content: msg.content,
    citations: msg.citations.map((c) => ({
      documentId: String(c.documentId),
      documentName: c.documentName,
      page: c.page,
      excerpt: c.excerpt,
    })),
    createdAt: msg.createdAt.toISOString(),
  };
}

export async function listChatMessages(owner: IUser, caseId: string): Promise<ChatMessageResponse[]> {
  await connectDB();
  const messages = await ChatMessage.find({ caseId, ownerId: owner._id })
    .sort({ createdAt: 1 })
    .lean<
      Array<{
        _id: Types.ObjectId;
        role: "user" | "assistant";
        content: string;
        citations: IChatCitation[];
        createdAt: Date;
      }>
    >();
  return messages.map(toResponse);
}

/** Short recent-history slice used as conversation context for follow-up questions — not the full transcript, to keep the prompt small. */
export async function getRecentChatHistory(
  owner: IUser,
  caseId: string
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  await connectDB();
  const messages = await ChatMessage.find({ caseId, ownerId: owner._id })
    .sort({ createdAt: -1 })
    .limit(MAX_HISTORY_FOR_CONTEXT)
    .select("role content")
    .lean<Array<{ role: "user" | "assistant"; content: string }>>();
  return messages.reverse();
}

export async function saveUserMessage(owner: IUser, caseId: string, content: string): Promise<ChatMessageResponse> {
  await connectDB();
  const created = await ChatMessage.create({
    caseId,
    ownerId: owner._id,
    role: "user",
    content,
    citations: [],
  });
  return toResponse(created.toObject());
}

export async function saveAssistantMessage(
  owner: IUser,
  caseId: string,
  content: string,
  citations: Array<{ documentId: string; documentName: string; page: number; excerpt: string }>
): Promise<ChatMessageResponse> {
  await connectDB();
  const created = await ChatMessage.create({
    caseId,
    ownerId: owner._id,
    role: "assistant",
    content,
    citations,
  });
  return toResponse(created.toObject());
}
