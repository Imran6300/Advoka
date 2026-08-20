import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/auth/getOwner";
import { getCaseForOwner } from "@/lib/db/queries/cases";
import { getDraftForOwner, updateDraftContent } from "@/lib/db/queries/drafts";
import { handleApiError, caseNotFoundResponse } from "@/lib/api/errors";

const MAX_CONTENT_LENGTH = 20000;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; draftId: string } }
) {
  try {
    const owner = await getOwner();
    const caseDoc = await getCaseForOwner(owner, params.id);
    if (!caseDoc) return caseNotFoundResponse();

    const draft = await getDraftForOwner(owner, params.id, params.draftId);
    if (!draft) return NextResponse.json({ error: "We couldn't find that draft." }, { status: 404 });

    return NextResponse.json({ draft });
  } catch (err) {
    return handleApiError(err);
  }
}

/** Persists the lawyer's edits — Drafting UI's Review → Edit → Save step. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; draftId: string } }
) {
  try {
    const owner = await getOwner();
    const caseDoc = await getCaseForOwner(owner, params.id);
    if (!caseDoc) return caseNotFoundResponse();

    const body = await req.json().catch(() => null);
    const content = typeof body?.content === "string" ? body.content : null;
    if (content === null) {
      return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: "That draft is too long to save — try trimming it." }, { status: 400 });
    }

    const draft = await updateDraftContent(owner, params.id, params.draftId, content);
    if (!draft) return NextResponse.json({ error: "We couldn't find that draft." }, { status: 404 });

    return NextResponse.json({ draft });
  } catch (err) {
    return handleApiError(err);
  }
}
