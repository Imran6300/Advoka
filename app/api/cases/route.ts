import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/auth/getOwner";
import { createCaseForOwner, listCasesForOwner } from "@/lib/db/queries/cases";
import { CASE_TYPES } from "@/lib/cases/constants";

export async function GET() {
  try {
    const owner = await getOwner();
    const cases = await listCasesForOwner(owner);
    return NextResponse.json({ cases });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const owner = await getOwner();
    const body = await req.json().catch(() => null);
    const { title, caseType, clientName, opposingParty, importantDate } = body ?? {};

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Case name is required." }, { status: 400 });
    }
    if (typeof clientName !== "string" || !clientName.trim()) {
      return NextResponse.json({ error: "Client name is required." }, { status: 400 });
    }
    if (typeof caseType !== "string" || !CASE_TYPES.includes(caseType as (typeof CASE_TYPES)[number])) {
      return NextResponse.json({ error: "Choose a valid case type." }, { status: 400 });
    }

    const created = await createCaseForOwner(owner, {
      title,
      caseType,
      clientName,
      opposingParty: typeof opposingParty === "string" ? opposingParty : undefined,
      importantDate: typeof importantDate === "string" && importantDate ? importantDate : null,
    });

    return NextResponse.json({ case: created }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

function handleError(err: unknown) {
  if (err instanceof Error && err.message === "UNAUTHENTICATED") {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }
  console.error(err);
  return NextResponse.json(
    { error: "Something went wrong on our end. Please try again." },
    { status: 500 }
  );
}
