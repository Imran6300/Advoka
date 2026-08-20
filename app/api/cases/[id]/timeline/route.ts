import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/auth/getOwner";
import { getCaseForOwner } from "@/lib/db/queries/cases";
import { listTimelineEvents } from "@/lib/db/queries/analysis";
import { handleApiError, caseNotFoundResponse } from "@/lib/api/errors";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const owner = await getOwner();
    const caseDoc = await getCaseForOwner(owner, params.id);
    if (!caseDoc) return caseNotFoundResponse();

    const events = await listTimelineEvents(owner, params.id);
    return NextResponse.json({
      timeline: events.map((e) => ({
        _id: String(e._id),
        date: e.date ? new Date(e.date).toISOString() : null,
        description: e.description,
        source: {
          documentId: String(e.sourceDocumentId._id),
          documentName: e.sourceDocumentId.originalFilename,
          page: e.sourcePage,
          excerpt: e.sourceExcerpt,
        },
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
