import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/auth/getOwner";
import { getCaseForOwner } from "@/lib/db/queries/cases";
import { listDeadlines } from "@/lib/db/queries/analysis";
import { handleApiError, caseNotFoundResponse } from "@/lib/api/errors";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const owner = await getOwner();
    const caseDoc = await getCaseForOwner(owner, params.id);
    if (!caseDoc) return caseNotFoundResponse();

    const items = await listDeadlines(owner, params.id);
    return NextResponse.json({
      deadlines: items.map((d) => ({
        _id: String(d._id),
        description: d.description,
        dueDate: new Date(d.dueDate).toISOString(),
        source: {
          documentId: String(d.sourceDocumentId._id),
          documentName: d.sourceDocumentId.originalFilename,
          page: d.sourcePage,
          excerpt: d.sourceExcerpt,
        },
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
