import { notFound } from "next/navigation";
import { CaseDetailShell } from "@/components/cases/case-detail-shell";
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
    <CaseDetailShell
      caseId={params.id}
      headerData={{
        title: caseDoc.title,
        caseType: caseDoc.caseType,
        clientName: caseDoc.clientName,
        opposingParty: caseDoc.opposingParty,
        importantDate: caseDoc.importantDate,
      }}
      initialStatus={initialStatus}
      initialAnalysis={initialAnalysis}
    />
  );
}
