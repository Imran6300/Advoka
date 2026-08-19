import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-sm border border-border bg-surface-elevated px-3 py-2 text-[13.5px] text-text-primary placeholder:text-text-muted transition-colors duration-hover ease-advoka focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
        // Chrome/Safari render the native date-picker icon in a color that
        // disappears on a dark surface — invert it so it stays visible.
        type === "date" && "[color-scheme:dark]",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
