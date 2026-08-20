import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/auth/getOwner";
import { getCaseGraphResponse } from "@/lib/db/queries/graph";
import { handleApiError, caseNotFoundResponse } from "@/lib/api/errors";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const owner = await getOwner();
    const graph = await getCaseGraphResponse(owner, params.id);
    if (!graph) return caseNotFoundResponse();

    return NextResponse.json(graph);
  } catch (err) {
    return handleApiError(err);
  }
}
