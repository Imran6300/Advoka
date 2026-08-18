import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Semantic mapping (§3): facts=indigo, evidence=sky, contradictions=rose,
// missing-info/deadlines=amber, verified=emerald, AI content=indigo/violet.
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[12px] font-medium leading-normal transition-colors duration-hover",
  {
    variants: {
      variant: {
        default: "border-border bg-surface-elevated text-text-secondary",
        primary: "border-primary/30 bg-primary/10 text-primary",
        ai: "border-ai-accent/30 bg-ai-accent/10 text-ai-accent",
        success: "border-success/30 bg-success/10 text-success",
        warning: "border-warning/30 bg-warning/10 text-warning",
        error: "border-error/30 bg-error/10 text-error",
        info: "border-info/30 bg-info/10 text-info",
        outline: "border-border text-text-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dotClassName?: string;
}

function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
