import { Check, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ANALYSIS_STEP_KEYS, ANALYSIS_STEP_LABEL } from "@/lib/cases/analysis-constants";
import type { AnalysisSteps } from "@/lib/cases/analysis-constants";

/**
 * §9 "Analyzing your case" — explicitly called out as a named trust moment,
 * not something to shortcut to a spinner. A real checklist:
 * ✓ Documents received / ✓ Text extracted / ✓ Documents indexed /
 * ● Finding key facts / ○ Detecting contradictions / ○ Building timeline
 */
export function AnalysisProgressCard({ steps }: { steps: AnalysisSteps }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-surface p-6">
      <div className="pointer-events-none absolute inset-0 animate-ai-glow bg-[radial-gradient(circle_at_top_left,_var(--ai-accent)_0%,_transparent_60%)] opacity-[0.06]" />

      <div className="relative flex flex-col gap-4">
        <div>
          <h3 className="text-[15px] font-semibold text-text-primary">Analyzing your case</h3>
          <p className="mt-0.5 text-[13px] text-text-muted">
            Advoka is reading through your documents to build the case overview. This usually takes under a minute.
          </p>
        </div>

        <ol className="flex flex-col gap-2.5">
          {ANALYSIS_STEP_KEYS.map((key) => {
            const state = steps[key];
            return (
              <li key={key} className="flex items-center gap-2.5 text-[13px]">
                {state === "done" && <Check className="h-4 w-4 shrink-0 text-success" />}
                {state === "active" && (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ai-accent" />
                )}
                {state === "pending" && <Circle className="h-3.5 w-3.5 shrink-0 text-text-muted" />}
                {state === "failed" && <Circle className="h-3.5 w-3.5 shrink-0 text-error" />}
                <span
                  className={cn(
                    "transition-colors duration-hover ease-advoka",
                    state === "done" && "text-text-secondary",
                    state === "active" && "font-medium text-text-primary",
                    state === "pending" && "text-text-muted",
                    state === "failed" && "text-error"
                  )}
                >
                  {ANALYSIS_STEP_LABEL[key]}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
