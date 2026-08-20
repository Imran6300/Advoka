"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DRAFT_TEMPLATE_LABEL, type DraftTemplateType } from "@/lib/cases/analysis-constants";
import { useToast } from "@/components/ui/use-toast";

export function DraftReview({
  templateType,
  content,
  onChange,
  onSave,
  onBack,
  isSaving,
}: {
  templateType: DraftTemplateType;
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  onBack: () => void;
  isSaving: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy", description: "Select and copy the text manually.", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-[12.5px] text-text-muted transition-colors duration-hover ease-advoka hover:text-text-secondary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to drafts
        </button>
        <h3 className="text-[14px] font-semibold text-text-primary">{DRAFT_TEMPLATE_LABEL[templateType]}</h3>
        <div className="w-[86px]" aria-hidden />
      </div>

      {/* Persistent badge, not a one-time toast — every time this draft is
          viewed, per build plan Day 6. */}
      <div className="flex items-center gap-1.5 rounded-sm border border-ai-accent/30 bg-ai-accent/10 px-3 py-1.5 text-[12px] font-medium text-ai-accent">
        <Sparkles className="h-3.5 w-3.5" />
        AI-generated draft — review carefully before sending or filing
      </div>

      <Textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        rows={18}
        className="font-mono text-[13px] leading-relaxed"
      />

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
