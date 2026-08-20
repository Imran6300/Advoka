"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DraftResponse } from "@/lib/cases/draft-types";
import type { DraftTemplateType } from "@/lib/cases/analysis-constants";

const POLL_INTERVAL_MS = 2500;

export function useDrafts(caseId: string) {
  const [drafts, setDrafts] = useState<DraftResponse[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDrafts = useCallback(async () => {
    const res = await fetch(`/api/cases/${caseId}/drafts`, { cache: "no-store" });
    if (!res.ok) return;
    const data: { drafts: DraftResponse[] } = await res.json();
    setDrafts(data.drafts);
    return data.drafts;
  }, [caseId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchDrafts();
      if (!cancelled) setIsLoadingList(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchDrafts]);

  const pollDraft = useCallback(
    (draftId: string, onSettled: (draft: DraftResponse) => void) => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        const res = await fetch(`/api/cases/${caseId}/drafts/${draftId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data: { draft: DraftResponse } = await res.json();
        setDrafts((prev) => {
          const idx = prev.findIndex((d) => d._id === draftId);
          if (idx === -1) return prev;
          const next = [...prev];
          next[idx] = data.draft;
          return next;
        });
        if (data.draft.status !== "pending") {
          if (pollRef.current) clearInterval(pollRef.current);
          onSettled(data.draft);
        }
      }, POLL_INTERVAL_MS);
    },
    [caseId]
  );

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const generateDraft = useCallback(
    async (
      templateType: DraftTemplateType,
      instructions: string
    ): Promise<{ draft?: DraftResponse; error?: string }> => {
      const res = await fetch(`/api/cases/${caseId}/drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateType, instructions }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        return { error: data?.error ?? "We couldn't start generating that draft. Please try again." };
      }
      setDrafts((prev) => [data.draft, ...prev]);
      return { draft: data.draft };
    },
    [caseId]
  );

  const saveDraftContent = useCallback(
    async (draftId: string, content: string): Promise<{ draft?: DraftResponse; error?: string }> => {
      const res = await fetch(`/api/cases/${caseId}/drafts/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        return { error: data?.error ?? "We couldn't save your changes. Please try again." };
      }
      setDrafts((prev) => prev.map((d) => (d._id === draftId ? data.draft : d)));
      return { draft: data.draft };
    },
    [caseId]
  );

  return { drafts, isLoadingList, generateDraft, pollDraft, saveDraftContent };
}
