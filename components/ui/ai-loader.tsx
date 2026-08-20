"use client";

import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * §8/§9/§19 — shared visual language for every place a real background job
 * (an Inngest step: document extraction, case analysis, graph build, draft
 * generation) is running. Replaces bare `Loader2` spinners with something
 * that reads as "Advoka is working," not "the page is stuck" — two
 * counter-rotating conic rings around a pulsing Sparkles mark, built only
 * from the existing --primary / --ai-accent tokens. Respects
 * prefers-reduced-motion via MotionConfig at the app root.
 */
export function AILoaderOrb({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const dims = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-16 w-16" : "h-11 w-11";
  const iconDims = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-4.5 w-4.5";

  return (
    <div className={cn("relative shrink-0", dims, className)}>
      <div className="ai-conic-ring absolute inset-0 rounded-full animate-spin-slow" />
      <div className="ai-conic-ring-reverse absolute inset-[3px] rounded-full animate-spin-reverse-slow" />
      <motion.div
        className="absolute inset-[3px] rounded-full bg-surface"
        animate={{ scale: [1, 0.96, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: [0.2, 0.8, 0.2, 1] }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <Sparkles className={cn(iconDims, "text-ai-accent")} />
        </motion.div>
      </div>
      {/* Expanding ping rings — reinforce "actively working," not frozen */}
      <span className="pointer-events-none absolute inset-0 rounded-full border border-ai-accent/40 animate-pulse-ring" />
      <span
        className="pointer-events-none absolute inset-0 rounded-full border border-primary/30 animate-pulse-ring"
        style={{ animationDelay: "1.1s" }}
      />
    </div>
  );
}

/** Three-dot wave, for inline/compact spots (chat "thinking" row, table cells). */
export function AIDotWave({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-end gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-ai-accent animate-dot-wave"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

/**
 * Full block-level loading state for a running background job, with a
 * title, a status line, and an optional elapsed-feel progress sweep.
 * This is the drop-in replacement for a bare centered `Loader2`.
 */
export function AIWorkingBlock({
  title,
  description,
  size = "md",
  className,
}: {
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-lg border border-border bg-surface py-16 text-center",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 animate-ai-glow bg-[radial-gradient(circle_at_50%_0%,_var(--ai-accent)_0%,_transparent_60%)] opacity-[0.07]" />
      <AILoaderOrb size={size} className="relative" />
      <div className="relative">
        <p className="text-[13.5px] font-medium text-text-primary">{title}</p>
        {description && <p className="mt-1 max-w-sm text-[12.5px] text-text-muted">{description}</p>}
      </div>
    </motion.div>
  );
}
