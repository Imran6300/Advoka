import { Citation } from "@/components/cases/citation";
import type { CitationRef, TimelineEventResponse } from "@/lib/cases/analysis-types";

function formatEventDate(date: string | null): string {
  if (!date) return "Undated";
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function TimelineSection({
  events,
  onViewSource,
}: {
  events: TimelineEventResponse[];
  onViewSource?: (source: CitationRef) => void;
}) {
  return (
    <ol className="flex flex-col">
      {events.map((event, index) => (
        <li key={event._id} className="relative flex gap-4 pb-5 last:pb-0">
          <div className="flex flex-col items-center">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
            {index < events.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
          </div>
          <div className="flex-1 pb-1">
            <p className="text-[12px] font-medium uppercase tracking-wide text-text-muted">
              {formatEventDate(event.date)}
            </p>
            <p className="mt-1 text-[13.5px] leading-snug text-text-primary">{event.description}</p>
            <Citation source={event.source} onViewSource={onViewSource} className="mt-1.5" />
          </div>
        </li>
      ))}
    </ol>
  );
}
