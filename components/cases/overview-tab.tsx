"use client";

import { useCallback } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalysisProgressCard } from "@/components/cases/analysis-progress-card";
import { AiSummaryCard } from "@/components/cases/ai-summary-card";
import { ContradictionCard } from "@/components/cases/contradiction-card";
import { MissingInfoCard } from "@/components/cases/missing-info-card";
import { FactCardGrid } from "@/components/cases/fact-card";
import { TimelineSection } from "@/components/cases/timeline-section";
import { DeadlineSection } from "@/components/cases/deadline-section";
import { useCaseAnalysis } from "@/lib/hooks/use-case-analysis";
import type { CaseAnalysisResponse, CitationRef } from "@/lib/cases/analysis-types";

function SectionHeading({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2">
      <h3 className="text-[13px] font-semibold uppercase tracking-wide text-text-muted">{title}</h3>
      {typeof count === "number" && (
        <span className="text-[12px] text-text-muted">({count})</span>
      )}
    </div>
  );
}

export function OverviewTab({
  caseId,
  hasExtractedDocuments,
  initialAnalysis,
  onNavigateToDocuments,
}: {
  caseId: string;
  hasExtractedDocuments: boolean;
  initialAnalysis: CaseAnalysisResponse | null;
  onNavigateToDocuments: () => void;
}) {
  const { analysis, isLoading, isTriggering, triggerError, triggerAnalysis } = useCaseAnalysis(
    caseId,
    initialAnalysis
  );

  // Stable identity (perf pass) — passed down into every FactCard,
  // ContradictionCard, and MissingInfoCard in the lists below, all of which
  // are memoized; a new function reference here on every poll tick would
  // defeat that memoization for the entire list on every render.
  const handleViewSource = useCallback(
    (_source: CitationRef) => {
      // No in-app page-level PDF viewer yet (out of scope for Day 4) — the
      // most useful thing to do today is take the lawyer straight to the
      // Documents tab where the source file lives.
      onNavigateToDocuments();
    },
    [onNavigateToDocuments]
  );

  const status = analysis?.status ?? "not_started";

  if (status === "not_started") {
    return (
      <EmptyState
        icon={<Sparkles className="h-5 w-5 text-text-muted" />}
        title={hasExtractedDocuments ? "Ready to analyze this case" : "No case intelligence yet"}
        description={
          hasExtractedDocuments
            ? "Advoka will read through your uploaded documents and generate an AI summary, key facts, contradictions, missing information, and a timeline — every claim backed by a source."
            : "Upload documents and Advoka will generate an AI summary, key facts, contradictions, missing information, and a timeline — every claim backed by a source."
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
        icon={<Sparkles className="h-5 w-5 text-error" />}
        title="We couldn't finish analyzing this case"
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

  // status === "ready"
  if (!analysis) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const keyFactsAndPeople = [...analysis.people, ...analysis.facts];
  const hasAnyIntelligence =
    keyFactsAndPeople.length > 0 ||
    analysis.evidence.length > 0 ||
    analysis.contradictions.length > 0 ||
    analysis.missingInfo.length > 0 ||
    analysis.timeline.length > 0 ||
    analysis.deadlines.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={triggerAnalysis}
          disabled={isTriggering}
          className="text-text-muted"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Re-analyze
        </Button>
      </div>

      {triggerError && (
        <p className="text-[13px] text-error">{triggerError}</p>
      )}

      {analysis.summary && <AiSummaryCard summary={analysis.summary} />}

      {analysis.contradictions.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeading title="Contradictions" count={analysis.contradictions.length} />
          <div className="flex flex-col gap-3">
            {analysis.contradictions.map((c) => (
              <ContradictionCard key={c._id} contradiction={c} onViewSource={handleViewSource} />
            ))}
          </div>
        </section>
      )}

      {analysis.missingInfo.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeading title="Missing information" count={analysis.missingInfo.length} />
          <div className="flex flex-col gap-3">
            {analysis.missingInfo.map((m) => (
              <MissingInfoCard key={m._id} item={m} onViewSource={handleViewSource} />
            ))}
          </div>
        </section>
      )}

      {keyFactsAndPeople.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeading title="Key facts" count={keyFactsAndPeople.length} />
          <FactCardGrid items={keyFactsAndPeople} onViewSource={handleViewSource} />
        </section>
      )}

      {analysis.evidence.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeading title="Evidence" count={analysis.evidence.length} />
          <FactCardGrid items={analysis.evidence} onViewSource={handleViewSource} />
        </section>
      )}

      {analysis.timeline.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeading title="Timeline" count={analysis.timeline.length} />
          <div className="rounded-lg border border-border bg-surface p-5">
            <TimelineSection events={analysis.timeline} onViewSource={handleViewSource} />
          </div>
        </section>
      )}

      {analysis.deadlines.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeading title="Deadlines" count={analysis.deadlines.length} />
          <DeadlineSection deadlines={analysis.deadlines} onViewSource={handleViewSource} />
        </section>
      )}

      {!hasAnyIntelligence && (
        <EmptyState
          icon={<Sparkles className="h-5 w-5 text-text-muted" />}
          title="Advoka didn't find anything to surface yet"
          description="Your documents were analyzed, but nothing met the bar for a confident, sourced claim. Try uploading more documents from this case."
          action={
            <Button variant="secondary" onClick={onNavigateToDocuments}>
              Upload more documents
            </Button>
          }
        />
      )}
    </div>
  );
}
