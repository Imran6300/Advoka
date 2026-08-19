import { currentUser } from "@clerk/nextjs/server";
import { AlertTriangle, FileStack, GitCompareArrows, Scale } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { CreateCaseDialog } from "@/components/cases/create-case-dialog";
import { CaseRow } from "@/components/cases/case-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { getOwner } from "@/lib/auth/getOwner";
import { getDashboardStatsForOwner } from "@/lib/db/queries/cases";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user = await currentUser();
  const owner = await getOwner();
  const stats = await getDashboardStatsForOwner(owner);
  const firstName = user?.firstName ?? "there";

  // §29 Level 3 — productivity metrics, now pulling real counts from Mongo.
  const metrics = [
    { label: "Active cases", value: stats.activeCases, icon: Scale },
    { label: "Documents processed", value: stats.documentsProcessed, icon: FileStack },
    { label: "Contradictions found", value: stats.contradictionsFound, icon: GitCompareArrows },
    { label: "Upcoming deadlines", value: stats.upcomingDeadlines, icon: AlertTriangle },
  ];

  return (
    <div className="flex flex-col gap-8 pb-16">
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description="Here's what's happening across your cases."
        action={<CreateCaseDialog />}
      />

      {/* §29 Level 1 — attention: deadlines, unreviewed contradictions, failed processing */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-text-muted">
          Needs your attention
        </h2>
        <EmptyState
          icon={<AlertTriangle className="h-5 w-5 text-text-muted" />}
          size="compact"
          title="Nothing needs your attention yet"
          description="Upcoming deadlines, unreviewed contradictions, and failed processing will surface here once your cases have documents to analyze."
        />
      </section>

      {/* §29 Level 3 — productivity metrics row */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => (
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
        {stats.recentCases.length === 0 ? (
          <EmptyState
            icon={<Scale className="h-5 w-5 text-text-muted" />}
            title="No cases yet"
            description="Create your first case and Advoka will start building case intelligence the moment you upload documents."
            action={<CreateCaseDialog />}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {stats.recentCases.map((c) => (
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
      </section>
    </div>
  );
}
