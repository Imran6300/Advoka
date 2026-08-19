import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/auth/getOwner";
import { getCaseForOwner } from "@/lib/db/queries/cases";
import { getDocumentForOwner } from "@/lib/db/queries/documents";
import { inngest } from "@/inngest/client";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  try {
    const owner = await getOwner();
    const caseDoc = await getCaseForOwner(owner, params.id);
    if (!caseDoc) {
      return NextResponse.json({ error: "We couldn't find that case." }, { status: 404 });
    }

    const document = await getDocumentForOwner(owner, params.id, params.documentId);
    if (!document) {
      return NextResponse.json({ error: "We couldn't find that document." }, { status: 404 });
    }

    document.status = "uploaded";
    document.errorMessage = undefined;
    await document.save();

    await inngest.send({
      name: "document.uploaded",
      data: {
        documentId: String(document._id),
        caseId: params.id,
        ownerId: String(owner._id),
      },
    });

    return NextResponse.json({ document });
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
