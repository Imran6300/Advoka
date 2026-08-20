"use client";

import { Scale, Mail, FileText, ReplyAll, Gavel } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  DRAFT_TEMPLATE_TYPES,
  DRAFT_TEMPLATE_LABEL,
  DRAFT_TEMPLATE_DESCRIPTION,
  type DraftTemplateType,
} from "@/lib/cases/analysis-constants";

const TEMPLATE_ICON: Record<DraftTemplateType, React.ElementType> = {
  legal_notice: Scale,
  client_email: Mail,
  case_summary: FileText,
  reply_to_notice: ReplyAll,
  application: Gavel,
};

export function DraftTemplatePicker({ onSelect }: { onSelect: (template: DraftTemplateType) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-[14px] font-semibold text-text-primary">Choose a template</h3>
        <p className="text-[12.5px] text-text-muted">Each template is tailored to what that document needs to do.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {DRAFT_TEMPLATE_TYPES.map((type) => {
          const Icon = TEMPLATE_ICON[type];
          return (
            <Card
              key={type}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(type)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelect(type);
              }}
              className="flex cursor-pointer items-start gap-3 p-4 transition-colors duration-hover ease-advoka hover:border-primary/40"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13.5px] font-medium text-text-primary">{DRAFT_TEMPLATE_LABEL[type]}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-text-muted">{DRAFT_TEMPLATE_DESCRIPTION[type]}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
