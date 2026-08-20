"use client";

import { MotionConfig } from "framer-motion";

/**
 * §25 Accessibility — `prefers-reduced-motion` in globals.css only catches
 * CSS transitions/animations. Every `motion.div` in this app (page headers,
 * empty states, the analysis progress card, the graph canvas) is driven by
 * framer-motion's own JS animation engine, which the media query can't see.
 * `reducedMotion="user"` makes framer-motion check the OS setting itself and
 * automatically swap every animation in the tree to an instant, opacity-only
 * transition for users who've asked for reduced motion — no per-component
 * changes needed.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
