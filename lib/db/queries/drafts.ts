import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { Draft } from "@/lib/db/models/Draft";
import type { IUser } from "@/lib/db/models/User";
import type { DraftTemplateType } from "@/lib/cases/analysis-constants";
import type { DraftResponse } from "@/lib/cases/draft-types";

function toResponse(draft: {
  _id: Types.ObjectId;
  templateType: DraftTemplateType;
  instructions: string;
  content: string;
  status: "pending" | "ready" | "failed";
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}): DraftResponse {
  return {
    _id: String(draft._id),
    templateType: draft.templateType,
    instructions: draft.instructions,
    content: draft.content,
    status: draft.status,
    error: draft.error ?? null,
    createdAt: draft.createdAt.toISOString(),
    updatedAt: draft.updatedAt.toISOString(),
  };
}

type LeanDraft = {
  _id: Types.ObjectId;
  templateType: DraftTemplateType;
  instructions: string;
  content: string;
  status: "pending" | "ready" | "failed";
  error?: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function listDraftsForCase(owner: IUser, caseId: string): Promise<DraftResponse[]> {
  await connectDB();
  const drafts = await Draft.find({ caseId, ownerId: owner._id })
    .sort({ createdAt: -1 })
    .lean<LeanDraft[]>();
  return drafts.map(toResponse);
}

export async function getDraftForOwner(owner: IUser, caseId: string, draftId: string): Promise<DraftResponse | null> {
  await connectDB();
  if (!Types.ObjectId.isValid(draftId)) return null;
  const draft = await Draft.findOne({ _id: draftId, caseId, ownerId: owner._id }).lean<LeanDraft | null>();
  return draft ? toResponse(draft) : null;
}

export async function createDraftForOwner(
  owner: IUser,
  caseId: string,
  templateType: DraftTemplateType,
  instructions: string
): Promise<DraftResponse> {
  await connectDB();
  const created = await Draft.create({
    caseId,
    ownerId: owner._id,
    templateType,
    instructions,
    content: "",
    status: "pending",
  });
  return toResponse(created.toObject());
}

export async function completeDraft(draftId: Types.ObjectId | string, content: string) {
  await connectDB();
  await Draft.updateOne({ _id: draftId }, { $set: { content, status: "ready", error: undefined } });
}

export async function failDraft(draftId: Types.ObjectId | string, error: string) {
  await connectDB();
  await Draft.updateOne({ _id: draftId }, { $set: { status: "failed", error } });
}

/** Persists a lawyer's edits to an already-generated draft (Review → Edit → Save). */
export async function updateDraftContent(
  owner: IUser,
  caseId: string,
  draftId: string,
  content: string
): Promise<DraftResponse | null> {
  await connectDB();
  if (!Types.ObjectId.isValid(draftId)) return null;
  const updated = await Draft.findOneAndUpdate(
    { _id: draftId, caseId, ownerId: owner._id },
    { $set: { content } },
    { new: true }
  ).lean<LeanDraft | null>();
  return updated ? toResponse(updated) : null;
}
