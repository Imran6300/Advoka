"use client";

import { motion } from "framer-motion";
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
        {DRAFT_TEMPLATE_TYPES.map((type, i) => {
          const Icon = TEMPLATE_ICON[type];
          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: i * 0.04, ease: [0.2, 0.8, 0.2, 1] }}
              whileHover={{ y: -2 }}
            >
              <Card
                role="button"
                tabIndex={0}
                onClick={() => onSelect(type)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelect(type);
                }}
                className="flex h-full cursor-pointer items-start gap-3 p-4 transition-all duration-hover ease-advoka hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[13.5px] font-medium text-text-primary">{DRAFT_TEMPLATE_LABEL[type]}</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-text-muted">{DRAFT_TEMPLATE_DESCRIPTION[type]}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
