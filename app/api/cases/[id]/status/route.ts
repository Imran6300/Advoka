import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/auth/getOwner";
import { getCaseForOwner } from "@/lib/db/queries/cases";
import { listDocumentsForCase } from "@/lib/db/queries/documents";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const owner = await getOwner();
    const caseDoc = await getCaseForOwner(owner, params.id);
    if (!caseDoc) {
      return NextResponse.json({ error: "We couldn't find that case." }, { status: 404 });
    }

    const documents = await listDocumentsForCase(owner, params.id);

    return NextResponse.json({
      caseStatus: caseDoc.status,
      stats: caseDoc.stats,
      documents: documents.map((d) => ({
        _id: String(d._id),
        originalFilename: d.originalFilename,
        mimeType: d.mimeType,
        sizeBytes: d.sizeBytes,
        status: d.status,
        pageCount: d.pageCount ?? null,
        errorMessage: d.errorMessage ?? null,
        createdAt: d.createdAt,
      })),
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong on our end. Please try again." },
      { status: 500 }
    );
  }
}
