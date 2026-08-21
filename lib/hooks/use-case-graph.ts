"use client";

import { useQuery } from "@tanstack/react-query";
import type { CaseGraphResponse } from "@/lib/cases/graph-types";

interface UseCaseGraphResult {
  graph: CaseGraphResponse | null;
  isLoading: boolean;
}

/**
 * Backed by React Query (perf pass — was a hand-rolled fetch + setInterval,
 * see use-case-analysis.ts for the full rationale). Keying on
 * `["case-graph", caseId]` means the Graph tab's data survives a tab
 * switch instead of refetching — and re-running dagre's layout — every
 * time the lawyer comes back to it, now that case-tabs.tsx keeps visited
 * tabs mounted instead of unmounting them.
 *
 * Two things can be "in flight" for this tab: the analysis itself
 * (analysisStatus === "processing"), and — once analysis is "ready" — the
 * graph-build step running as its own trailing Inngest function, which is
 * why `caseStatus` (Case.status, flips to "ready" only once graph-build
 * finishes) is checked separately from `analysisStatus`.
 */
export function useCaseGraph(caseId: string, analysisStatus: string): UseCaseGraphResult {
  const query = useQuery({
    queryKey: ["case-graph", caseId],
    queryFn: async (): Promise<CaseGraphResponse> => {
      const res = await fetch(`/api/cases/${caseId}/graph`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch graph");
      return res.json();
    },
    refetchInterval: (q) => {
      const data = q.state.data as CaseGraphResponse | undefined;
      const stillWaiting =
        analysisStatus === "processing" || (!!data && data.analysisStatus === "ready" && data.caseStatus !== "ready");
      return stillWaiting ? 3000 : false;
    },
  });

  return { graph: query.data ?? null, isLoading: query.isLoading };
}
