"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CaseGraphResponse } from "@/lib/cases/graph-types";

const POLL_INTERVAL_MS = 3000;

interface UseCaseGraphResult {
  graph: CaseGraphResponse | null;
  isLoading: boolean;
}

/**
 * Mirrors lib/hooks/use-case-analysis.ts's plain fetch + setInterval
 * pattern (no WebSockets, per the build plan's status-polling convention).
 *
 * Two things can be "in flight" for the Graph tab: the analysis itself
 * (analysisStatus === "processing"), and — once analysis is "ready" — the
 * graph-build step running as its own trailing Inngest function, which is
 * why `caseStatus` (Case.status, flips to "ready" only once graph-build
 * finishes) is checked separately from `analysisStatus`.
 */
export function useCaseGraph(caseId: string, analysisStatus: string): UseCaseGraphResult {
  const [graph, setGraph] = useState<CaseGraphResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchGraph = useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}/graph`, { cache: "no-store" });
      if (!res.ok) return undefined;
      const data: CaseGraphResponse = await res.json();
      setGraph(data);
      return data;
    } catch {
      return undefined;
    }
  }, [caseId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      await fetchGraph();
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // Re-fetch once the Overview tab's own polling reports analysis moving
    // out of "processing" — this tab may be mounted before that happens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  useEffect(() => {
    const stillWaiting =
      analysisStatus === "processing" || (graph && graph.analysisStatus === "ready" && graph.caseStatus !== "ready");

    if (!stillWaiting) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(fetchGraph, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [analysisStatus, graph, fetchGraph]);

  return { graph, isLoading };
}
