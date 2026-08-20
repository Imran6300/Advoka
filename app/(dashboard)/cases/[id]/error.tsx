"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function CaseDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[case-detail] segment error:", error);
  }, [error]);

  return (
    <ErrorState
      title="This case couldn't load"
      description="Something went wrong loading this case's details. Your documents and analysis are unaffected — try again."
      onRetry={reset}
    />
  );
}
