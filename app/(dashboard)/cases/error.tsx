"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function CasesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[cases] segment error:", error);
  }, [error]);

  return (
    <ErrorState
      title="We couldn't load your cases"
      description="Something went wrong fetching your case list. Nothing has been lost — try again in a moment."
      onRetry={reset}
    />
  );
}
