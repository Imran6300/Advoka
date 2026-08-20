"use client";

import { useState } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const COLLAPSED_CHAR_LIMIT = 220;

export function AiSummaryCard({ summary }: { summary: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = summary.length > COLLAPSED_CHAR_LIMIT;
  const displayText =
    expanded || !isLong ? summary : `${summary.slice(0, COLLAPSED_CHAR_LIMIT).trimEnd()}…`;

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-ai-accent" />
          <h3 className="ai-gradient-text text-[14px] font-semibold">AI case summary</h3>
        </div>
        <Badge variant="ai">AI generated</Badge>
      </div>

      <p className="mt-3 text-[14px] leading-relaxed text-text-secondary">{displayText}</p>

      {isLong && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-auto px-0 text-[12px] text-text-muted hover:bg-transparent hover:text-text-secondary"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "Show more"}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-hover ease-advoka",
              expanded && "rotate-180"
            )}
          />
        </Button>
      )}
    </div>
  );
}
