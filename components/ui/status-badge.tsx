import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CASE_STATUS_LABEL, type CaseStatus } from "@/lib/cases/constants";

const VARIANT: Record<CaseStatus, "default" | "info" | "success"> = {
  draft: "default",
  processing: "info",
  ready: "success",
};

const DOT: Record<CaseStatus, string> = {
  draft: "bg-text-muted",
  processing: "bg-info",
  ready: "bg-success",
};

/**
 * §25 Accessibility — status is never conveyed by color alone, so the text
 * label always renders alongside the dot/color.
 */
export function StatusBadge({ status, className }: { status: CaseStatus; className?: string }) {
  return (
    <Badge variant={VARIANT[status]} className={cn("gap-1.5", className)}>
      <span className="relative flex h-1.5 w-1.5 shrink-0 items-center justify-center">
        {status === "processing" && (
          <span className="absolute inset-0 -m-1 animate-pulse-ring rounded-full bg-info/60" />
        )}
        <span className={cn("relative h-1.5 w-1.5 rounded-full", DOT[status], status === "processing" && "animate-pulse")} />
      </span>
      {CASE_STATUS_LABEL[status]}
    </Badge>
  );
}
