"use client";

import { useCallback } from "react";
import dynamic from "next/dynamic";
import { Network, Sparkles, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AIWorkingBlock } from "@/components/ui/ai-loader";
import { useCaseGraph } from "@/lib/hooks/use-case-graph";
import { MIN_GRAPH_NODES_TO_RENDER } from "@/lib/cases/graph-constants";
import type { CitationRef } from "@/lib/cases/analysis-types";

// Perf pass — reactflow + dagre are only ever needed on this one tab, but
// were previously imported statically, shipping their JS to every case page
// even when the Graph tab is never opened. Loading it on demand (client-only
// — ReactFlow measures the DOM, so it can't render on the server anyway)
// keeps it out of the initial case-page bundle entirely.
const CaseGraphView = dynamic(
  () => import("@/components/graph/CaseGraphView").then((mod) => mod.CaseGraphView),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-24 rounded-sm" />
          ))}
        </div>
        <Skeleton className="h-[560px] w-full rounded-lg" />
      </div>
    ),
  }
);

/**
 * §8 Case Relationship Graph — build plan Day 5. Every branch here mirrors
 * a real pipeline state rather than a generic spinner:
 *   not started      -> point the lawyer at Overview to run analysis
 *   analysis running -> point at Overview's progress checklist (the named
 *                       trust moment already lives there, not duplicated)
 *   analysis failed  -> mirror the failure, same as Overview
 *   graph building    -> the graph-build Inngest step trailing analysis
 *   sparse / no edges -> "Not enough cross-referenced entities yet" (§8,
 *                        verbatim from the architecture doc) rather than a
 *                        lonely, broken-looking 2-node graph
 *   ready             -> the real canvas
 */
export function GraphTab({
  caseId,
  hasExtractedDocuments,
  initialAnalysisStatus,
  onNavigateToOverview,
  onNavigateToDocuments,
}: {
  caseId: string;
  hasExtractedDocuments: boolean;
  initialAnalysisStatus: string;
  onNavigateToOverview: () => void;
  onNavigateToDocuments: () => void;
}) {
  const { graph, isLoading } = useCaseGraph(caseId, initialAnalysisStatus);

  const handleViewSource = useCallback(
    (_source: CitationRef) => {
      onNavigateToDocuments();
    },
    [onNavigateToDocuments]
  );

  if (isLoading && !graph) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-24 rounded-sm" />
          ))}
        </div>
        <Skeleton className="h-[560px] w-full rounded-lg" />
      </div>
    );
  }

  const status = graph?.analysisStatus ?? "not_started";

  if (status === "not_started") {
    return (
      <EmptyState
        icon={<Network className="h-5 w-5 text-text-muted" />}
        title={hasExtractedDocuments ? "Run analysis to build the case graph" : "Not enough cross-referenced entities yet"}
        description={
          hasExtractedDocuments
            ? "The case graph is built from the people, evidence, and contradictions Advoka finds during analysis — run it from the Overview tab first."
            : "Upload documents so Advoka can map the people, evidence, and contradictions in this case."
        }
        action={
          hasExtractedDocuments && (
            <button
              type="button"
              onClick={onNavigateToOverview}
              className="text-[13px] font-medium text-primary hover:underline"
            >
              Go to Overview
            </button>
          )
        }
      />
    );
  }

  if (status === "processing") {
    return (
      <EmptyState
        icon={<Sparkles className="h-5 w-5 text-ai-accent" />}
        title="Advoka is still analyzing this case"
        description="The relationship graph is built right after analysis finishes — check the Overview tab to watch progress."
        action={
          <button
            type="button"
            onClick={onNavigateToOverview}
            className="text-[13px] font-medium text-primary hover:underline"
          >
            View progress
          </button>
        }
      />
    );
  }

  if (status === "failed") {
    return (
      <EmptyState
        icon={<RefreshCw className="h-5 w-5 text-error" />}
        title="Analysis didn't complete"
        description="Advoka couldn't finish analyzing this case, so there's no graph to build yet. Retry analysis from the Overview tab."
        action={
          <button
            type="button"
            onClick={onNavigateToOverview}
            className="text-[13px] font-medium text-primary hover:underline"
          >
            Go to Overview
          </button>
        }
      />
    );
  }

  // analysis is "ready" but the trailing graph-build Inngest step hasn't
  // flipped Case.status to "ready" yet — a short, real window, not a fake wait.
  if (graph && graph.caseStatus !== "ready") {
    return (
      <AIWorkingBlock
        title="Building your case graph"
        description="Advoka is mapping the relationships between people, evidence, and contradictions in this case. This usually takes a few seconds."
      />
    );
  }

  const nodeCount = graph?.nodes.length ?? 0;
  const edgeCount = graph?.edges.length ?? 0;

  if (nodeCount < MIN_GRAPH_NODES_TO_RENDER || edgeCount === 0) {
    return (
      <EmptyState
        icon={<Network className="h-5 w-5 text-text-muted" />}
        title="Not enough cross-referenced entities yet"
        description="Upload more documents so Advoka can map the people, evidence, and contradictions in this case."
      />
    );
  }

  return <CaseGraphView nodes={graph!.nodes} edges={graph!.edges} onViewSource={handleViewSource} />;
}
