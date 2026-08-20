"use client";

import { useState } from "react";
import { PenLine, Plus, ArrowLeft, AlertCircle as AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AIWorkingBlock } from "@/components/ui/ai-loader";
import { useToast } from "@/components/ui/use-toast";
import { DraftTemplatePicker } from "@/components/drafts/draft-template-picker";
import { DraftReview } from "@/components/drafts/draft-review";
import { DraftHistoryList } from "@/components/drafts/draft-history-list";
import { useDrafts } from "@/lib/hooks/use-drafts";
import { DRAFT_TEMPLATE_LABEL, type DraftTemplateType } from "@/lib/cases/analysis-constants";
import type { DraftResponse } from "@/lib/cases/draft-types";

type Step = "list" | "picker" | "instructions" | "generating" | "review";

export function DraftsTab({ caseId }: { caseId: string }) {
  const { drafts, isLoadingList, generateDraft, pollDraft, saveDraftContent } = useDrafts(caseId);
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("list");
  const [template, setTemplate] = useState<DraftTemplateType | null>(null);
  const [instructions, setInstructions] = useState("");
  const [activeDraft, setActiveDraft] = useState<DraftResponse | null>(null);
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const resetToList = () => {
    setStep("list");
    setTemplate(null);
    setInstructions("");
    setActiveDraft(null);
    setContent("");
  };

  const handleGenerate = async () => {
    if (!template || !instructions.trim()) return;
    setIsGenerating(true);
    const { draft, error } = await generateDraft(template, instructions.trim());
    setIsGenerating(false);

    if (error || !draft) {
      toast({ title: "Couldn't start generating", description: error, variant: "destructive" });
      return;
    }

    setActiveDraft(draft);
    setStep("generating");
    pollDraft(draft._id, (settled) => {
      setActiveDraft(settled);
      if (settled.status === "ready") {
        setContent(settled.content);
        setStep("review");
      } else if (settled.status === "failed") {
        toast({
          title: "Draft generation failed",
          description: settled.error ?? "Please try again.",
          variant: "destructive",
        });
        setStep("instructions");
      }
    });
  };

  const handleOpenDraft = (draft: DraftResponse) => {
    setActiveDraft(draft);
    setTemplate(draft.templateType);
    setContent(draft.content);
    if (draft.status === "pending") {
      setStep("generating");
      pollDraft(draft._id, (settled) => {
        setActiveDraft(settled);
        if (settled.status === "ready") {
          setContent(settled.content);
          setStep("review");
        } else if (settled.status === "failed") {
          setStep("review"); // show the failed state inline below
        }
      });
    } else {
      setStep("review");
    }
  };

  const handleSave = async () => {
    if (!activeDraft) return;
    setIsSaving(true);
    const { draft, error } = await saveDraftContent(activeDraft._id, content);
    setIsSaving(false);
    if (error) {
      toast({ title: "Couldn't save", description: error, variant: "destructive" });
      return;
    }
    if (draft) setActiveDraft(draft);
    toast({ title: "Draft saved" });
  };

  if (step === "picker") {
    return (
      <div className="flex flex-col gap-4">
        <BackRow onBack={() => setStep("list")} />
        <DraftTemplatePicker
          onSelect={(t) => {
            setTemplate(t);
            setStep("instructions");
          }}
        />
      </div>
    );
  }

  if (step === "instructions" && template) {
    return (
      <div className="flex flex-col gap-4">
        <BackRow onBack={() => setStep("picker")} />
        <div>
          <h3 className="text-[14px] font-semibold text-text-primary">{DRAFT_TEMPLATE_LABEL[template]}</h3>
          <p className="text-[12.5px] text-text-muted">
            Tell Advoka what this draft needs to say — it'll ground the rest in the case's facts and documents.
          </p>
        </div>
        <Textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g. Draft a notice demanding return of the security deposit within 15 days, referencing the lease agreement and the inspection report."
          rows={6}
          autoFocus
        />
        <div className="flex justify-end">
          <Button onClick={handleGenerate} disabled={!instructions.trim() || isGenerating}>
            {isGenerating ? "Starting…" : "Generate Draft"}
          </Button>
        </div>
      </div>
    );
  }

  if (step === "generating") {
    return (
      <AIWorkingBlock
        title={`Drafting your ${template ? DRAFT_TEMPLATE_LABEL[template] : "document"}…`}
        description="This usually takes 10–20 seconds."
      />
    );
  }

  if (step === "review" && template) {
    if (activeDraft?.status === "failed") {
      return (
        <div className="flex flex-col gap-4">
          <BackRow onBack={resetToList} />
          <EmptyState
            icon={<AlertCircleIcon className="h-5 w-5 text-error" />}
            title="This draft failed to generate"
            description={activeDraft.error ?? "Advoka couldn't generate this draft. Please try again."}
          />
        </div>
      );
    }
    return (
      <DraftReview
        templateType={template}
        content={content}
        onChange={setContent}
        onSave={handleSave}
        onBack={resetToList}
        isSaving={isSaving}
      />
    );
  }

  // step === "list"
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-text-primary">Drafts</h3>
          <p className="text-[12.5px] text-text-muted">AI-drafted documents for this case, ready for your review.</p>
        </div>
        <Button onClick={() => setStep("picker")}>
          <Plus className="h-4 w-4" />
          New Draft
        </Button>
      </div>

      {isLoadingList ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-16 w-full rounded-md" />
        </div>
      ) : drafts.length === 0 ? (
        <EmptyState
          icon={<PenLine className="h-5 w-5 text-text-muted" />}
          title="No drafts yet"
          description="Generate a legal notice, client email, case summary, reply, or application grounded in this case's facts."
          action={
            <button
              type="button"
              onClick={() => setStep("picker")}
              className="text-[13px] font-medium text-primary hover:underline"
            >
              Create your first draft
            </button>
          }
        />
      ) : (
        <DraftHistoryList drafts={drafts} onOpen={handleOpenDraft} />
      )}
    </div>
  );
}

function BackRow({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="flex w-fit items-center gap-1 text-[12.5px] text-text-muted transition-colors duration-hover ease-advoka hover:text-text-secondary"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back
    </button>
  );
}
