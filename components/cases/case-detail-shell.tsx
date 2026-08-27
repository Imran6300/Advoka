"use client";

import { CaseHeader, type CaseHeaderData } from "@/components/cases/case-header";
import { CaseTabs } from "@/components/cases/case-tabs";
import { useCaseStatus, type CaseStatusResponse } from "@/lib/hooks/use-case-status";
import type { CaseAnalysisResponse } from "@/lib/cases/analysis-types";

/**
 * §Bugfix — CaseHeader's status badge used to be a static value passed
 * straight from the server-rendered page, with nothing on the client ever
 * refetching it. The only place `useCaseStatus` (the hook that polls
 * Case.status) got called was inside the Documents tab — which, thanks to
 * case-tabs.tsx's forceMount-once-visited behavior, doesn't even mount
 * until the lawyer clicks into that tab. Net effect: a lawyer sitting on
 * the Overview tab while a case finishes processing saw the "Processing"
 * badge frozen forever, even after the case actually finished server-side
 * (graphBuild.ts's fix means it always finishes now, one way or another).
 *
 * This wrapper calls the same hook once, above the tabs, purely to drive
 * the header badge live. React Query dedupes by query key
 * (["case-status", caseId]), so this doesn't add a second network request
 * beyond whatever the Documents tab is already polling — it just means the
 * badge updates the moment *either* consumer's poll comes back.
 */
export function CaseDetailShell({
  caseId,
  headerData,
  initialStatus,
  initialAnalysis,
}: {
  caseId: string;
  headerData: Omit<CaseHeaderData, "status">;
  initialStatus: CaseStatusResponse;
  initialAnalysis: CaseAnalysisResponse | null;
}) {
  const { data } = useCaseStatus(caseId, initialStatus);
  const liveStatus = data?.caseStatus ?? initialStatus.caseStatus;
  const hasExtractedDocuments = (data?.documents ?? initialStatus.documents).some(
    (d) => d.status === "extracted"
  );

  return (
    <div className="flex flex-col gap-6">
      <CaseHeader caseData={{ ...headerData, status: liveStatus }} />
      <CaseTabs
        caseId={caseId}
        initialStatus={initialStatus}
        initialAnalysis={initialAnalysis}
        hasExtractedDocuments={hasExtractedDocuments}
      />
    </div>
  );
}
