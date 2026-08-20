import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/auth/getOwner";
import { getCaseForOwner } from "@/lib/db/queries/cases";
import { listMissingInfoFlags } from "@/lib/db/queries/analysis";
import { handleApiError, caseNotFoundResponse } from "@/lib/api/errors";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const owner = await getOwner();
    const caseDoc = await getCaseForOwner(owner, params.id);
    if (!caseDoc) return caseNotFoundResponse();

    const items = await listMissingInfoFlags(owner, params.id);
    return NextResponse.json({
      missingInfo: items.map((m) => ({
        _id: String(m._id),
        title: m.title,
        description: m.description,
        actionLabel: m.actionLabel,
        source:
          m.sourceDocumentId && m.sourcePage
            ? {
                documentId: String(m.sourceDocumentId._id),
                documentName: m.sourceDocumentId.originalFilename,
                page: m.sourcePage,
                excerpt: m.sourceExcerpt ?? "",
              }
            : null,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
