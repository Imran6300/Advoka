import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Citation } from "@/components/cases/citation";
import type { CitationRef, ContradictionResponse } from "@/lib/cases/analysis-types";

export function ContradictionCard({
  contradiction,
  onViewSource,
}: {
  contradiction: ContradictionResponse;
  onViewSource?: (source: CitationRef) => void;
}) {
  return (
    <div className="rounded-lg border border-error/25 bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
          <p className="text-[14px] font-medium leading-snug text-text-primary">
            {contradiction.description}
          </p>
        </div>
        <Badge variant="error" className="shrink-0">
          Review Required
        </Badge>
      </div>

      <p className="mt-2 pl-[26px] text-[13px] leading-relaxed text-text-secondary">
        {contradiction.whyFlagged}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 pl-[26px] sm:grid-cols-2">
        <div className="rounded-md border border-border bg-surface-elevated p-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            Source A
          </p>
          <Citation source={contradiction.sourceA} onViewSource={onViewSource} defaultExpanded />
        </div>
        <div className="rounded-md border border-border bg-surface-elevated p-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            Source B
          </p>
          <Citation source={contradiction.sourceB} onViewSource={onViewSource} defaultExpanded />
        </div>
      </div>
    </div>
  );
}
