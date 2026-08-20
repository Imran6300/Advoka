import { NextResponse } from "next/server";

/**
 * Every API route resolves the owner via getOwner() and wraps its body in
 * try/catch → handleApiError(err). Pulled into a shared helper on Day 4
 * once the same three-branch shape (unauthenticated / not found / generic)
 * started repeating across five new analysis routes — Day 1–3 routes keep
 * their own local copies rather than being churned for this.
 */
export function handleApiError(err: unknown) {
  if (err instanceof Error && err.message === "UNAUTHENTICATED") {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }
  console.error(err);
  return NextResponse.json(
    { error: "Something went wrong on our end. Please try again." },
    { status: 500 }
  );
}

export function caseNotFoundResponse() {
  return NextResponse.json({ error: "We couldn't find that case." }, { status: 404 });
}
