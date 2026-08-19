import { Scale } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { CreateCaseDialog } from "@/components/cases/create-case-dialog";
import { CaseRow } from "@/components/cases/case-row";
import { EmptyState } from "@/components/ui/empty-state";
import { getOwner } from "@/lib/auth/getOwner";
import { listCasesForOwner } from "@/lib/db/queries/cases";

export default async function CasesPage() {
  const owner = await getOwner();
  const cases = await listCasesForOwner(owner);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Cases"
        description="Every case you're working on, in one place."
        action={<CreateCaseDialog />}
      />

      {cases.length === 0 ? (
        <EmptyState
          icon={<Scale className="h-5 w-5 text-text-muted" />}
          title="No cases yet"
          description="Create your first case and Advoka will start building case intelligence the moment you upload documents."
          action={<CreateCaseDialog />}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {cases.map((c) => (
            <CaseRow
              key={String(c._id)}
              caseData={{
                _id: String(c._id),
                title: c.title,
                caseType: c.caseType,
                clientName: c.clientName,
                status: c.status,
                updatedAt: c.updatedAt,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
