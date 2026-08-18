import { Scale } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { CreateCaseButton } from "@/components/shell/create-case-button";
import { Card, CardContent } from "@/components/ui/card";

export default function CasesPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Cases"
        description="Every case you're working on, in one place."
        action={<CreateCaseButton />}
      />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-surface-elevated">
            <Scale className="h-5 w-5 text-text-muted" />
          </div>
          <div>
            <p className="text-[14px] font-medium text-text-primary">No cases yet</p>
            <p className="mt-1 max-w-sm text-[13px] text-text-secondary">
              Case creation, the case list, and status tracking land on Day 2 of the
              build. For now this is your quiet, correctly-themed starting point.
            </p>
          </div>
          <CreateCaseButton />
        </CardContent>
      </Card>
    </div>
  );
}
