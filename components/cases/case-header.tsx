"use client";

import { motion } from "framer-motion";
import { CalendarDays, Scale, User, Users } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { CaseStatus } from "@/lib/cases/constants";

export interface CaseHeaderData {
  title: string;
  caseType: string;
  clientName: string;
  opposingParty?: string;
  importantDate?: string | Date | null;
  status: CaseStatus;
}

function MetaItem({ icon: Icon, label }: { icon: typeof Scale; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[13px] text-text-secondary">
      <Icon className="h-3.5 w-3.5 shrink-0 text-text-muted" />
      <span className="truncate">{label}</span>
    </div>
  );
}

export function CaseHeader({ caseData }: { caseData: CaseHeaderData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-[24px] font-bold tracking-tight text-text-primary">
            {caseData.title}
          </h1>
        </div>
        <StatusBadge status={caseData.status} className="mt-1 shrink-0" />
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <MetaItem icon={Scale} label={caseData.caseType} />
        <MetaItem icon={User} label={`Client: ${caseData.clientName}`} />
        {caseData.opposingParty && (
          <MetaItem icon={Users} label={`Opposing: ${caseData.opposingParty}`} />
        )}
        {caseData.importantDate && (
          <MetaItem
            icon={CalendarDays}
            label={new Date(caseData.importantDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          />
        )}
      </div>
    </motion.div>
  );
}
