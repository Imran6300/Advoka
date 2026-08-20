"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ANALYSIS_STEP_KEYS, ANALYSIS_STEP_LABEL } from "@/lib/cases/analysis-constants";
import type { AnalysisSteps } from "@/lib/cases/analysis-constants";

/**
 * §9 "Analyzing your case" — explicitly called out as a named trust moment,
 * not something to shortcut to a spinner. A real checklist:
 * ✓ Documents received / ✓ Text extracted / ✓ Documents indexed /
 * ● Finding key facts / ○ Detecting contradictions / ○ Building timeline
 *
 * §19 extension — each row now animates in with a stagger, a connecting
 * rail behind the markers fills as steps complete, the active step gets a
 * soft breathing highlight, and a real completion percentage drives a
 * progress bar under the header — all still fed by the same `steps` prop,
 * no new data requirements.
 */
export function AnalysisProgressCard({ steps }: { steps: AnalysisSteps }) {
  const total = ANALYSIS_STEP_KEYS.length;
  const doneCount = ANALYSIS_STEP_KEYS.filter((k) => steps[k] === "done").length;
  const percent = Math.round((doneCount / total) * 100);

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-surface p-6">
      <div className="pointer-events-none absolute inset-0 animate-ai-glow bg-[radial-gradient(circle_at_top_left,_var(--ai-accent)_0%,_transparent_60%)] opacity-[0.06]" />

      <div className="relative flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[15px] font-semibold text-text-primary">Analyzing your case</h3>
            <span className="text-[12px] font-medium tabular-nums text-text-muted">{percent}%</span>
          </div>
          <p className="mt-0.5 text-[13px] text-text-muted">
            Advoka is reading through your documents to build the case overview. This usually takes under a minute.
          </p>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-elevated">
            <motion.div
              className="ai-gradient-bg-animated h-full animate-gradient-x rounded-full"
              initial={false}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            />
          </div>
        </div>

        <ol className="relative flex flex-col">
          {/* Connecting rail behind the step markers, filling with completed steps */}
          <div className="pointer-events-none absolute left-[7px] top-1.5 bottom-1.5 w-px bg-border" aria-hidden />
          <motion.div
            className="pointer-events-none absolute left-[7px] top-1.5 w-px bg-success/70"
            initial={false}
            animate={{
              height:
                total > 1
                  ? `${(Math.max(doneCount - 1, 0) / (total - 1)) * 100}%`
                  : "0%",
            }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            aria-hidden
          />

          {ANALYSIS_STEP_KEYS.map((key, i) => {
            const state = steps[key];
            return (
              <motion.li
                key={key}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
                className={cn(
                  "relative flex items-center gap-2.5 py-1.5 pl-0 text-[13px]",
                  state === "active" && "rounded-md bg-ai-accent/[0.05] px-2 -mx-2"
                )}
              >
                <span className="relative flex h-[15px] w-[15px] shrink-0 items-center justify-center">
                  <AnimatePresence mode="wait" initial={false}>
                    {state === "done" && (
                      <motion.span
                        key="done"
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.4, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                        className="flex h-[15px] w-[15px] items-center justify-center rounded-full bg-success/15"
                      >
                        <Check className="h-3 w-3 text-success" />
                      </motion.span>
                    )}
                    {state === "active" && (
                      <motion.span key="active" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-ai-accent" />
                      </motion.span>
                    )}
                    {state === "pending" && (
                      <motion.span
                        key="pending"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="h-[9px] w-[9px] rounded-full border border-text-muted"
                      />
                    )}
                    {state === "failed" && (
                      <motion.span
                        key="failed"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="h-[9px] w-[9px] rounded-full bg-error"
                      />
                    )}
                  </AnimatePresence>
                </span>
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
              </motion.li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
