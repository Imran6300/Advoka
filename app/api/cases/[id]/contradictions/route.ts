import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/auth/getOwner";
import { getCaseForOwner } from "@/lib/db/queries/cases";
import { listContradictions } from "@/lib/db/queries/analysis";
import { handleApiError, caseNotFoundResponse } from "@/lib/api/errors";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const owner = await getOwner();
    const caseDoc = await getCaseForOwner(owner, params.id);
    if (!caseDoc) return caseNotFoundResponse();

    const items = await listContradictions(owner, params.id);
    return NextResponse.json({
      contradictions: items.map((c) => ({
        _id: String(c._id),
        description: c.description,
        whyFlagged: c.whyFlagged,
        reviewed: c.reviewed,
        sourceA: {
          documentId: String(c.sourceA.documentId._id),
          documentName: c.sourceA.documentId.originalFilename,
          page: c.sourceA.page,
          excerpt: c.sourceA.excerpt,
        },
        sourceB: {
          documentId: String(c.sourceB.documentId._id),
          documentName: c.sourceB.documentId.originalFilename,
          page: c.sourceB.page,
          excerpt: c.sourceB.excerpt,
        },
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
