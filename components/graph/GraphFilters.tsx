"use client";

import { User, FileCheck, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRAPH_NODE_TYPE_COLOR_VAR, GRAPH_NODE_TYPE_LABEL, VISIBLE_GRAPH_NODE_TYPES, type VisibleGraphNodeType } from "@/lib/cases/graph-constants";

const ICON: Record<VisibleGraphNodeType, React.ElementType> = {
  person: User,
  evidence: FileCheck,
  contradiction: AlertTriangle,
  missingInfo: AlertCircle,
};

export function GraphFilters({
  active,
  onToggle,
  counts,
}: {
  active: Record<VisibleGraphNodeType, boolean>;
  onToggle: (type: VisibleGraphNodeType) => void;
  counts: Record<VisibleGraphNodeType, number>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {VISIBLE_GRAPH_NODE_TYPES.map((type) => {
        const Icon = ICON[type];
        const isActive = active[type];
        const color = GRAPH_NODE_TYPE_COLOR_VAR[type];
        return (
          <button
            key={type}
            type="button"
            onClick={() => onToggle(type)}
            className={cn(
              "flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[12px] font-medium transition-all duration-hover ease-advoka",
              isActive ? "bg-surface-elevated text-text-primary" : "bg-transparent text-text-muted opacity-60"
            )}
            style={{ borderColor: isActive ? `${color}66` : "var(--border)" }}
            aria-pressed={isActive}
          >
            <Icon className="h-3.5 w-3.5" style={{ color: isActive ? color : undefined }} />
            {GRAPH_NODE_TYPE_LABEL[type]}
            <span className="text-text-muted">({counts[type] ?? 0})</span>
          </button>
        );
      })}
    </div>
  );
}
