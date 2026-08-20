import { FileCheck, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Citation } from "@/components/cases/citation";
import type { CitationRef, FactItemResponse } from "@/lib/cases/analysis-types";

/**
 * §7 Overview "compact fact cards, source line under each" — reused for Key
 * Facts, Evidence, and (People, rendered inline within Key Facts) since
 * they share the same underlying CaseFact shape.
 */
export function FactCard({
  fact,
  onViewSource,
}: {
  fact: FactItemResponse;
  onViewSource?: (source: CitationRef) => void;
}) {
  return (
    <div className="rounded-md border border-border bg-surface-elevated p-3.5">
      <div className="flex items-start gap-2">
        {fact.type === "person" ? (
          <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        ) : (
          <FileCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-[13.5px] leading-snug text-text-primary">{fact.content}</p>
            {fact.personRole && (
              <Badge variant="primary" className="shrink-0">
                {fact.personRole}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <Citation source={fact.source} onViewSource={onViewSource} className="mt-2 pl-[22px]" />
    </div>
  );
}

export function FactCardGrid({
  items,
  onViewSource,
}: {
  items: FactItemResponse[];
  onViewSource?: (source: CitationRef) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {items.map((item) => (
        <FactCard key={item._id} fact={item} onViewSource={onViewSource} />
      ))}
    </div>
  );
}
