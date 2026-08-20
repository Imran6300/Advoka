"use client";

import { useState } from "react";
import { FileText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { CitationRef } from "@/lib/cases/analysis-types";

/**
 * §10 Citation UX: "Document name / Page number / Short source excerpt.
 * Click opens the source document to that page." Built once here, reused
 * for facts, evidence, timeline, deadlines, contradictions, missing info —
 * every AI claim in the app renders through this one component so the
 * citation experience is identical everywhere.
 *
 * There's no in-app PDF page viewer yet (out of scope for Day 4 — the
 * Documents tab lists files, it doesn't render them page-by-page), so
 * "click to open the source" switches to the Documents tab and highlights
 * which file + page the claim came from, rather than deep-linking into a
 * viewer that doesn't exist yet.
 */
export function Citation({
  source,
  onViewSource,
  className,
  defaultExpanded = false,
}: {
  source: CitationRef;
  onViewSource?: (source: CitationRef) => void;
  className?: string;
  /** Contradiction cards show the excerpt open by default (§13 requires
   * both sides' excerpts visible without an extra click); every other
   * citation stays collapsed until clicked to keep dense lists scannable. */
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="group flex items-center gap-1.5 rounded-sm text-[12px] text-text-muted transition-colors duration-hover ease-advoka hover:text-text-secondary"
      >
        <FileText className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate max-w-[220px]">{source.documentName}</span>
        <span className="text-text-muted">· p.{source.page}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 text-text-muted transition-transform duration-hover ease-advoka",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div className="animate-in fade-in-0 slide-in-from-top-1 duration-card ease-advoka rounded-md border border-border bg-surface px-3 py-2">
          <p className="text-[13px] leading-relaxed text-text-secondary">&ldquo;{source.excerpt}&rdquo;</p>
          {onViewSource && (
            <Button
              variant="link"
              size="sm"
              className="mt-1 h-auto px-0 text-[12px]"
              onClick={() => onViewSource(source)}
            >
              View source document
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
