"use client";

import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import type { CaseAnalysisResponse } from "@/lib/cases/analysis-types";

interface UseCaseAnalysisResult {
  analysis: CaseAnalysisResponse | null;
  isLoading: boolean;
  isTriggering: boolean;
  triggerError: string | null;
  triggerAnalysis: () => Promise<void>;
}

function analysisQueryKey(caseId: string) {
  return ["case-analysis", caseId] as const;
}

/**
 * Backed by React Query instead of a per-component `setInterval` (perf pass
 * — Overview and Timeline both read this same resource; a hand-rolled
 * interval per component meant two independent polling loops hitting
 * `/api/cases/[id]/analysis` in parallel whenever both tabs stayed mounted
 * at once, which is exactly what the new "keep tabs alive" behavior in
 * case-tabs.tsx does). React Query keys the query on
 * `["case-analysis", caseId]`, so every consumer shares one in-flight
 * request and one poll timer no matter how many components call this hook
 * at the same time — and its default structural sharing keeps unchanged
 * nested facts/contradictions/timeline arrays referentially stable across
 * polls, so memoized list rows below don't re-render just because a poll
 * tick came back with identical data.
 *
 * Public shape is unchanged from the original fetch+setInterval version so
 * every consumer (overview-tab, timeline-tab) needed zero changes.
 */
export function useCaseAnalysis(
  caseId: string,
  initialAnalysis: CaseAnalysisResponse | null
): UseCaseAnalysisResult {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerError, setTriggerError] = useState<string | null>(null);
  const [isRefetchingAfterTrigger, setIsRefetchingAfterTrigger] = useState(false);

  const query = useQuery({
    queryKey: analysisQueryKey(caseId),
    queryFn: async (): Promise<CaseAnalysisResponse> => {
      const res = await fetch(`/api/cases/${caseId}/analysis`);
      if (!res.ok) throw new Error("Failed to fetch analysis");
      return res.json();
    },
    initialData: initialAnalysis ?? undefined,
    // Only the poll below (while "processing") or an explicit trigger should
    // cause a refetch — matches the original hook, which never fetched on
    // mount unless analysis was already mid-run.
    staleTime: Infinity,
    refetchInterval: (q) => {
      const data = q.state.data as CaseAnalysisResponse | undefined;
      return data?.status === "processing" ? 3000 : false;
    },
  });

  const triggerAnalysis = useCallback(async () => {
    setIsTriggering(true);
    setTriggerError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/analyze`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        const message = data?.error || "Couldn't start analysis. Please try again.";
        setTriggerError(message);
        toast({ title: "Analysis couldn't start", description: message, variant: "destructive" });
        return;
      }

      setIsRefetchingAfterTrigger(true);
      await queryClient.refetchQueries({ queryKey: analysisQueryKey(caseId), exact: true });
      setIsRefetchingAfterTrigger(false);
    } catch {
      const message = "Couldn't reach the server. Check your connection and try again.";
      setTriggerError(message);
      toast({ title: "Analysis couldn't start", description: message, variant: "destructive" });
    } finally {
      setIsTriggering(false);
    }
  }, [caseId, queryClient, toast]);

  return {
    analysis: query.data ?? null,
    isLoading: isRefetchingAfterTrigger,
    isTriggering,
    triggerError,
    triggerAnalysis,
  };
}
