import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/auth/getOwner";
import { getCaseForOwner } from "@/lib/db/queries/cases";
import { listDraftsForCase, createDraftForOwner } from "@/lib/db/queries/drafts";
import { DRAFT_TEMPLATE_TYPES } from "@/lib/cases/analysis-constants";
import { inngest } from "@/inngest/client";
import { handleApiError, caseNotFoundResponse } from "@/lib/api/errors";

const MAX_INSTRUCTIONS_LENGTH = 3000;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const owner = await getOwner();
    const caseDoc = await getCaseForOwner(owner, params.id);
    if (!caseDoc) return caseNotFoundResponse();

    const drafts = await listDraftsForCase(owner, params.id);
    return NextResponse.json({ drafts });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * architecture §3: `draft.generate.requested` runs through Inngest, same
 * "heavy work never runs inline in an API route" discipline as
 * analysis/graph — this route validates, creates the pending Draft record,
 * enqueues the job, and returns immediately; the Drafting UI polls
 * GET /api/cases/:id/drafts/:draftId for the result.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const owner = await getOwner();
    const caseDoc = await getCaseForOwner(owner, params.id);
    if (!caseDoc) return caseNotFoundResponse();

    const body = await req.json().catch(() => null);
    const templateType = body?.templateType;
    const instructions = typeof body?.instructions === "string" ? body.instructions.trim() : "";

    if (!DRAFT_TEMPLATE_TYPES.includes(templateType)) {
      return NextResponse.json({ error: "Choose a draft template." }, { status: 400 });
    }
    if (!instructions) {
      return NextResponse.json({ error: "Add a few instructions for the draft." }, { status: 400 });
    }
    if (instructions.length > MAX_INSTRUCTIONS_LENGTH) {
      return NextResponse.json({ error: "Instructions are too long — try trimming them." }, { status: 400 });
    }

    const draft = await createDraftForOwner(owner, params.id, templateType, instructions);

    await inngest.send({
      name: "draft.generate.requested",
      data: { draftId: draft._id, caseId: params.id, ownerId: String(owner._id) },
    });

    return NextResponse.json({ draft }, { status: 202 });
  } catch (err) {
    return handleApiError(err);
  }
}
