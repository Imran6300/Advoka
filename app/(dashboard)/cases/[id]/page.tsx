import { notFound } from "next/navigation";
import { CaseHeader } from "@/components/cases/case-header";
import { CaseTabs } from "@/components/cases/case-tabs";
import { getOwner } from "@/lib/auth/getOwner";
import { getCaseForOwner } from "@/lib/db/queries/cases";
import { listDocumentsForCase } from "@/lib/db/queries/documents";
import { getCaseAnalysisResponse } from "@/lib/db/queries/analysis";
import type { CaseStatusResponse } from "@/lib/hooks/use-case-status";

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const owner = await getOwner();
  const caseDoc = await getCaseForOwner(owner, params.id);

  if (!caseDoc) {
    notFound();
  }

  const [documents, initialAnalysis] = await Promise.all([
    listDocumentsForCase(owner, params.id),
    getCaseAnalysisResponse(owner, params.id),
  ]);

  const initialStatus: CaseStatusResponse = {
    caseStatus: caseDoc.status,
    stats: caseDoc.stats,
    documents: documents.map((d) => ({
      _id: String(d._id),
      originalFilename: d.originalFilename,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      status: d.status,
      pageCount: d.pageCount ?? null,
      errorMessage: d.errorMessage ?? null,
      createdAt: (d.createdAt as unknown as Date).toISOString(),
    })),
  };

  return (
    <div className="flex flex-col gap-6">
      <CaseHeader
        caseData={{
          title: caseDoc.title,
          caseType: caseDoc.caseType,
          clientName: caseDoc.clientName,
          opposingParty: caseDoc.opposingParty,
          importantDate: caseDoc.importantDate,
          status: caseDoc.status,
        }}
      />
      <CaseTabs caseId={params.id} initialStatus={initialStatus} initialAnalysis={initialAnalysis} />
    </div>
  );
}
