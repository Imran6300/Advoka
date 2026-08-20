"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * §23 Error states — specific, non-technical messaging with a clear retry
 * action, never a raw stack trace. This is the shared shape used by every
 * route-segment `error.tsx` boundary (§7 Next.js error boundaries) so a
 * failed dashboard, case list, or case detail load all fail the same,
 * recognizable way instead of each inventing its own error screen.
 */
export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this. Please try again — if it keeps happening, your connection or our servers may be the cause, not anything you did.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <Card className={cn("border-error/20", className)}>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-error/10">
          <AlertCircle className="h-5 w-5 text-error" />
        </div>
        <div>
          <p className="text-[14px] font-medium text-text-primary">{title}</p>
          <p className="mt-1 max-w-sm text-[13px] text-text-secondary">{description}</p>
        </div>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
