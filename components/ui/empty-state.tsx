"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

/**
 * §22 Empty states — every major section needs a useful, action-oriented
 * empty state, never a generic "Nothing here." Built once on Day 2, reused
 * for every tab/section for the rest of the build.
 *
 * `icon` takes a rendered element (e.g. `<AlertTriangle className="h-5 w-5
 * text-text-muted" />`), not a component reference. This component is a
 * Client Component, and several call sites are Server Components — a raw
 * component function can't cross that boundary, only serializable React
 * elements can.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  size = "default",
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  size?: "default" | "compact";
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent
        className={cn(
          "flex flex-col items-center justify-center gap-3 text-center",
          size === "compact" ? "py-10" : "py-16"
        )}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex h-11 w-11 items-center justify-center rounded-md bg-surface-elevated"
        >
          {icon}
        </motion.div>
        <div>
          <p className="text-[14px] font-medium text-text-primary">{title}</p>
          <p className="mt-1 max-w-sm text-[13px] text-text-secondary">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
