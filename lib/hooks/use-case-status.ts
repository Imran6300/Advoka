"use client";

import { useQuery } from "@tanstack/react-query";
import type { CaseStatus } from "@/lib/cases/constants";

export interface PolledDocument {
  _id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  status: "uploaded" | "extracting" | "extracted" | "failed";
  pageCount: number | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface CaseStatusResponse {
  caseStatus: CaseStatus;
  stats: {
    documentsCount: number;
    keyFactsCount: number;
    contradictionsCount: number;
    missingInfoCount: number;
    deadlinesCount: number;
  };
  documents: PolledDocument[];
}

const IN_FLIGHT = new Set(["uploaded", "extracting"]);

/**
 * Polls case + document status every 4s while anything is still processing,
 * and stops once every document has settled — no WebSockets needed at this
 * scale (architecture §2). `initialData` should come from the server-rendered
 * case detail page so the tab never flashes empty on first paint.
 */
export function useCaseStatus(caseId: string, initialData: CaseStatusResponse) {
  return useQuery({
    queryKey: ["case-status", caseId],
    queryFn: async (): Promise<CaseStatusResponse> => {
      const res = await fetch(`/api/cases/${caseId}/status`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch case status");
      return res.json();
    },
    initialData,
    refetchInterval: (query) => {
      const data = query.state.data as CaseStatusResponse | undefined;
      const stillProcessing = data?.documents.some((d) => IN_FLIGHT.has(d.status));
      return stillProcessing ? 4000 : false;
    },
  });
}
