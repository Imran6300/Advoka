import { memo } from "react";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Citation } from "@/components/cases/citation";
import type { CitationRef, MissingInfoResponse } from "@/lib/cases/analysis-types";

/** Memoized (perf pass) — see fact-card.tsx for the structural-sharing rationale. */
export const MissingInfoCard = memo(function MissingInfoCard({
  item,
  onViewSource,
}: {
  item: MissingInfoResponse;
  onViewSource?: (source: CitationRef) => void;
}) {
  return (
    <div className="rounded-lg border border-warning/25 bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <p className="text-[14px] font-medium leading-snug text-text-primary">{item.title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{item.description}</p>
          </div>
        </div>
        <Badge variant="warning" className="shrink-0">
          Action needed
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pl-[26px]">
        {item.source ? (
          <Citation source={item.source} onViewSource={onViewSource} />
        ) : (
          <span className="text-[12px] text-text-muted">General gap — no single source page</span>
        )}
        <span className="rounded-sm border border-warning/30 bg-warning/10 px-2 py-0.5 text-[12px] font-medium text-warning">
          {item.actionLabel}
        </span>
      </div>
    </div>
  );
});
