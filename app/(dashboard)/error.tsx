"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Client-side visibility only — no server logging pipeline yet, but this
    // is the one place to wire one in later without touching every page.
    console.error("[dashboard] segment error:", error);
  }, [error]);

  return (
    <ErrorState
      title="This page couldn't load"
      description="Something went wrong loading your dashboard. Your cases and documents are safe — this is just a display error."
      onRetry={reset}
    />
  );
}
