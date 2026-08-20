import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/auth/getOwner";
import { getCaseForOwner } from "@/lib/db/queries/cases";
import { listDocumentsForCase } from "@/lib/db/queries/documents";
import { inngest } from "@/inngest/client";
import { handleApiError, caseNotFoundResponse } from "@/lib/api/errors";

/**
 * Idempotent trigger (architecture §12): if analysis is already running,
 * re-firing this just returns the current in-progress state rather than
 * queueing a second pipeline. If it already completed, re-running from here
 * intentionally clears and regenerates the analysis (e.g. after uploading
 * more documents) — the Inngest function itself does the reset.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const owner = await getOwner();
    const caseDoc = await getCaseForOwner(owner, params.id);
    if (!caseDoc) return caseNotFoundResponse();

    if (caseDoc.analysis?.status === "processing") {
      return NextResponse.json({ status: "processing", alreadyRunning: true });
    }

    const documents = await listDocumentsForCase(owner, params.id);
    const extractedCount = documents.filter((d) => d.status === "extracted").length;

    if (extractedCount === 0) {
      return NextResponse.json(
        { error: "Upload at least one document that finishes processing before running analysis." },
        { status: 400 }
      );
    }

    await inngest.send({
      name: "case.analyze.requested",
      data: { caseId: params.id, ownerId: String(owner._id) },
    });

    return NextResponse.json({ status: "processing" }, { status: 202 });
  } catch (err) {
    return handleApiError(err);
  }
}
