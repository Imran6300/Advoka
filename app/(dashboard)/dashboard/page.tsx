import { currentUser } from "@clerk/nextjs/server";
import { AlertTriangle, FileStack, GitCompareArrows, Scale } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { CreateCaseButton } from "@/components/shell/create-case-button";
import { Card, CardContent } from "@/components/ui/card";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// §29 Level 3 — productivity metrics. Wired to real Mongo counts on Day 2;
// zeroed here since no case data exists yet.
const METRICS = [
  { label: "Active cases", value: 0, icon: Scale },
  { label: "Documents processed", value: 0, icon: FileStack },
  { label: "Contradictions found", value: 0, icon: GitCompareArrows },
  { label: "Upcoming deadlines", value: 0, icon: AlertTriangle },
];

export default async function DashboardPage() {
  const user = await currentUser();
  const firstName = user?.firstName ?? "there";

  return (
    <div className="flex flex-col gap-8 pb-16">
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description="Here's what's happening across your cases."
        action={<CreateCaseButton />}
      />

      {/* §29 Level 1 — attention: deadlines, unreviewed contradictions, failed processing */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-text-muted">
          Needs your attention
        </h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-elevated">
              <AlertTriangle className="h-5 w-5 text-text-muted" />
            </div>
            <p className="text-[14px] font-medium text-text-primary">
              Nothing needs your attention yet
            </p>
            <p className="max-w-sm text-[13px] text-text-secondary">
              Upcoming deadlines, unreviewed contradictions, and failed processing will
              surface here once you create your first case.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* §29 Level 3 — productivity metrics row */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {METRICS.map((m) => (
          <Card key={m.label}>
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-surface-elevated">
                <m.icon className="h-4 w-4 text-text-muted" />
              </div>
              <div>
                <p className="text-[30px] font-bold leading-none text-text-primary">
                  {m.value}
                </p>
                <p className="mt-1.5 text-[13px] text-text-secondary">{m.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Recent cases */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-text-muted">
          Recent cases
        </h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-surface-elevated">
              <Scale className="h-5 w-5 text-text-muted" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-text-primary">No cases yet</p>
              <p className="mt-1 max-w-sm text-[13px] text-text-secondary">
                Create your first case and Advoka will start building case
                intelligence the moment you upload documents.
              </p>
            </div>
            <CreateCaseButton />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
