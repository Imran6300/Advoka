import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { CaseStatus } from "@/lib/cases/constants";

export interface CaseRowData {
  _id: string;
  title: string;
  caseType: string;
  clientName: string;
  status: CaseStatus;
  updatedAt: string | Date;
}

function formatRelativeDate(date: string | Date) {
  const d = new Date(date);
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function CaseRow({ caseData }: { caseData: CaseRowData }) {
  return (
    <Link href={`/cases/${caseData._id}`} className="block">
      <Card className="transition-colors duration-card ease-advoka hover:border-text-muted">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-text-primary">{caseData.title}</p>
            <p className="mt-0.5 truncate text-[13px] text-text-secondary">
              {caseData.caseType} · {caseData.clientName}
            </p>
          </div>
          <p className="hidden shrink-0 text-[12.5px] text-text-muted sm:block">
            Updated {formatRelativeDate(caseData.updatedAt)}
          </p>
          <StatusBadge status={caseData.status} className="shrink-0" />
          <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
        </CardContent>
      </Card>
    </Link>
  );
}
