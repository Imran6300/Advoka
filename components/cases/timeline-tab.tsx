"use client";

import { Clock, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalysisProgressCard } from "@/components/cases/analysis-progress-card";
import { TimelineSection } from "@/components/cases/timeline-section";
import { DeadlineSection } from "@/components/cases/deadline-section";
import { useCaseAnalysis } from "@/lib/hooks/use-case-analysis";
import type { CaseAnalysisResponse, CitationRef } from "@/lib/cases/analysis-types";

/**
 * The dedicated Timeline tab, previously a hardcoded empty state (a Day 4/5
 * gap — the real timeline data has existed in the analysis response since
 * Day 4, it just was never wired up here). Mirrors the Overview tab's
 * status handling exactly, since it reads from the same analysis resource,
 * but surfaces only the chronological event list and deadlines full-width.
 */
export function TimelineTab({
  caseId,
  hasExtractedDocuments,
  initialAnalysis,
  onNavigateToDocuments,
  onNavigateToOverview,
}: {
  caseId: string;
  hasExtractedDocuments: boolean;
  initialAnalysis: CaseAnalysisResponse | null;
  onNavigateToDocuments: () => void;
  onNavigateToOverview: () => void;
}) {
  const { analysis, isLoading, isTriggering, triggerAnalysis } = useCaseAnalysis(
    caseId,
    initialAnalysis
  );

  const status = analysis?.status ?? "not_started";

  if (status === "not_started") {
    return (
      <EmptyState
        icon={<Clock className="h-5 w-5 text-text-muted" />}
        title={hasExtractedDocuments ? "Ready to build this case's timeline" : "No timeline yet"}
        description={
          hasExtractedDocuments
            ? "Run case analysis and Advoka will pull dates and deadlines out of your documents into a single chronological timeline, each event linked to its source."
            : "Upload documents and run case analysis to generate a chronological timeline of events and deadlines."
        }
        action={
          hasExtractedDocuments ? (
            <Button variant="ai" onClick={triggerAnalysis} disabled={isTriggering}>
              <Sparkles className="h-4 w-4" />
              {isTriggering ? "Starting analysis…" : "Analyze this case"}
            </Button>
          ) : (
            <Button variant="ai" onClick={onNavigateToDocuments}>
              Upload Documents
            </Button>
          )
        }
      />
    );
  }

  if (status === "processing" || isLoading) {
    return <AnalysisProgressCard steps={analysis?.steps ?? initialAnalysis?.steps ?? ({} as never)} />;
  }

  if (status === "failed") {
    return (
      <EmptyState
        icon={<Clock className="h-5 w-5 text-error" />}
        title="We couldn't build this case's timeline"
        description={
          analysis?.error ||
          "Something went wrong while Advoka was reading your documents. This doesn't affect your uploaded files — you can safely try again."
        }
        action={
          <Button variant="secondary" onClick={triggerAnalysis} disabled={isTriggering}>
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        }
      />
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const handleViewSource = (_source: CitationRef) => onNavigateToDocuments();
  const hasTimeline = analysis.timeline.length > 0;
  const hasDeadlines = analysis.deadlines.length > 0;

  if (!hasTimeline && !hasDeadlines) {
    return (
      <EmptyState
        icon={<Clock className="h-5 w-5 text-text-muted" />}
        title="No dated events found"
        description="Advoka analyzed this case but didn't find confident, sourced dates or deadlines to place on a timeline yet. This can happen with documents that are mostly narrative rather than dated correspondence."
        action={
          <Button variant="secondary" onClick={onNavigateToOverview}>
            Back to Overview
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {hasDeadlines && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-text-muted">
              Deadlines
            </h3>
            <span className="text-[12px] text-text-muted">({analysis.deadlines.length})</span>
          </div>
          <DeadlineSection deadlines={analysis.deadlines} onViewSource={handleViewSource} />
        </section>
      )}

      {hasTimeline && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-text-muted">
              Timeline
            </h3>
            <span className="text-[12px] text-text-muted">({analysis.timeline.length})</span>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5">
            <TimelineSection events={analysis.timeline} onViewSource={handleViewSource} />
          </div>
        </section>
      )}
    </div>
  );
}
