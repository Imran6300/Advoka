"use client";

import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DRAFT_TEMPLATE_LABEL } from "@/lib/cases/analysis-constants";
import type { DraftResponse } from "@/lib/cases/draft-types";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function DraftHistoryList({ drafts, onOpen }: { drafts: DraftResponse[]; onOpen: (draft: DraftResponse) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {drafts.map((draft) => (
        <Card
          key={draft._id}
          role="button"
          tabIndex={0}
          onClick={() => onOpen(draft)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onOpen(draft);
          }}
          className="flex cursor-pointer items-center justify-between gap-3 p-3.5 transition-colors duration-hover ease-advoka hover:border-primary/40"
        >
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-text-primary">
              {DRAFT_TEMPLATE_LABEL[draft.templateType]}
            </p>
            <p className="truncate text-[12px] text-text-muted">{draft.instructions}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusPill status={draft.status} />
            <span className="text-[11.5px] text-text-muted">{timeAgo(draft.createdAt)}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}

function StatusPill({ status }: { status: DraftResponse["status"] }) {
  if (status === "pending") {
    return (
      <span className="flex items-center gap-1 rounded-sm bg-ai-accent/10 px-2 py-0.5 text-[11px] font-medium text-ai-accent">
        <Loader2 className="h-3 w-3 animate-spin" />
        Generating
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="flex items-center gap-1 rounded-sm bg-error/10 px-2 py-0.5 text-[11px] font-medium text-error">
        <AlertCircle className="h-3 w-3" />
        Failed
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-sm bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
      <Sparkles className="h-3 w-3" />
      Ready
    </span>
  );
}
