"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { CaseAnalysisResponse } from "@/lib/cases/analysis-types";

const POLL_INTERVAL_MS = 3000;

interface UseCaseAnalysisResult {
  analysis: CaseAnalysisResponse | null;
  isLoading: boolean;
  isTriggering: boolean;
  triggerError: string | null;
  triggerAnalysis: () => Promise<void>;
}

/**
 * Mirrors the shape of lib/hooks/use-case-status.ts (Day 3) — plain fetch +
 * setInterval, no WebSockets, matching the build plan's status-polling
 * convention. Polls only while analysis is actively processing; stops the
 * moment it lands on "ready" or "failed".
 */
export function useCaseAnalysis(
  caseId: string,
  initialAnalysis: CaseAnalysisResponse | null
): UseCaseAnalysisResult {
  const [analysis, setAnalysis] = useState<CaseAnalysisResponse | null>(initialAnalysis);
  const [isLoading, setIsLoading] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerError, setTriggerError] = useState<string | null>(null);
  const { toast } = useToast();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAnalysis = useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}/analysis`);
      if (!res.ok) return;
      const data: CaseAnalysisResponse = await res.json();
      setAnalysis(data);
      return data;
    } catch {
      // Silent — the next poll tick will retry. Matches use-case-status's approach.
      return undefined;
    }
  }, [caseId]);

  useEffect(() => {
    if (analysis?.status !== "processing") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(async () => {
      const data = await fetchAnalysis();
      if (data && data.status !== "processing" && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis?.status, fetchAnalysis]);

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

      setIsLoading(true);
      await fetchAnalysis();
      setIsLoading(false);
    } catch {
      const message = "Couldn't reach the server. Check your connection and try again.";
      setTriggerError(message);
      toast({ title: "Analysis couldn't start", description: message, variant: "destructive" });
    } finally {
      setIsTriggering(false);
    }
  }, [caseId, fetchAnalysis, toast]);

  return { analysis, isLoading, isTriggering, triggerError, triggerAnalysis };
}
