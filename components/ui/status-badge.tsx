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
  processing: "bg-info animate-pulse",
  ready: "bg-success",
};

/**
 * §25 Accessibility — status is never conveyed by color alone, so the text
 * label always renders alongside the dot/color.
 */
export function StatusBadge({ status, className }: { status: CaseStatus; className?: string }) {
  return (
    <Badge variant={VARIANT[status]} className={cn("gap-1.5", className)}>
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT[status])} />
      {CASE_STATUS_LABEL[status]}
    </Badge>
  );
}
