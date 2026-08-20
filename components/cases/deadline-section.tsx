import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Citation } from "@/components/cases/citation";
import { deadlineStatus, daysRemainingLabel, DEADLINE_STATUS_LABEL } from "@/lib/cases/deadline-status";
import type { CitationRef, DeadlineResponse } from "@/lib/cases/analysis-types";
import type { DeadlineStatus } from "@/lib/cases/deadline-status";

const STATUS_BADGE_VARIANT: Record<DeadlineStatus, "error" | "warning" | "success"> = {
  overdue: "error",
  approaching: "warning",
  upcoming: "success",
};

export function DeadlineSection({
  deadlines,
  onViewSource,
}: {
  deadlines: DeadlineResponse[];
  onViewSource?: (source: CitationRef) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {deadlines.map((deadline) => {
        const status = deadlineStatus(deadline.dueDate);
        return (
          <div
            key={deadline._id}
            className="flex flex-col gap-2 rounded-md border border-border bg-surface-elevated p-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-2.5">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
              <div>
                <p className="text-[13.5px] leading-snug text-text-primary">{deadline.description}</p>
                <p className="mt-0.5 text-[12px] text-text-muted">
                  {new Date(deadline.dueDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {" · "}
                  {daysRemainingLabel(deadline.dueDate)}
                </p>
                <Citation source={deadline.source} onViewSource={onViewSource} className="mt-1.5" />
              </div>
            </div>
            {/* Status is never color-only — the label text always accompanies it (§25 Accessibility). */}
            <Badge variant={STATUS_BADGE_VARIANT[status]} className="shrink-0 self-start sm:self-center">
              {DEADLINE_STATUS_LABEL[status]}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
