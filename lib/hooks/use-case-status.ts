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
      // §Bugfix — this used to stop polling once every *document* settled,
      // but Case.status doesn't flip to "ready" until analysis + graph
      // build finish afterward. That gap meant a case sitting between
      // "documents extracted" and "analysis/graph complete" stopped
      // refetching, so its badge never updated to "Ready" (or surfaced a
      // failure) without a manual page reload. Keep polling until the
      // case itself has actually settled.
      const documentsInFlight = data?.documents.some((d) => IN_FLIGHT.has(d.status));
      const caseInFlight = data?.caseStatus === "processing";
      return documentsInFlight || caseInFlight ? 4000 : false;
    },
  });
}
