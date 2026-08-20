"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, User, FileCheck, AlertTriangle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Citation } from "@/components/cases/citation";
import { GRAPH_NODE_TYPE_COLOR_VAR, GRAPH_NODE_TYPE_LABEL, type VisibleGraphNodeType } from "@/lib/cases/graph-constants";
import type { CitationRef, GraphNodeResponse } from "@/lib/cases/graph-types";

const ICON: Record<VisibleGraphNodeType, React.ElementType> = {
  person: User,
  evidence: FileCheck,
  contradiction: AlertTriangle,
  missingInfo: AlertCircle,
};

export function GraphSidePanel({
  node,
  onClose,
  onViewSource,
}: {
  node: GraphNodeResponse | null;
  onClose: () => void;
  onViewSource?: (source: CitationRef) => void;
}) {
  return (
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ x: 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 24, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          className="absolute right-3 top-3 z-10 flex max-h-[calc(100%-24px)] w-[320px] flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
        >
          <div className="flex items-start justify-between gap-2 border-b border-border p-4">
            <div className="flex items-start gap-2.5">
              <NodeIcon type={node.type} />
              <div>
                <Badge variant={badgeVariantFor(node.type)} className="mb-1.5">
                  {GRAPH_NODE_TYPE_LABEL[node.type]}
                </Badge>
                {node.personRole && <p className="text-[12px] text-text-muted">{node.personRole}</p>}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose} aria-label="Close panel">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-[13.5px] leading-relaxed text-text-primary">{node.description}</p>

            {node.type === "contradiction" && node.whyFlagged && (
              <p className="mt-2 text-[12.5px] leading-relaxed text-text-secondary">{node.whyFlagged}</p>
            )}

            {node.type === "missingInfo" && node.actionLabel && (
              <span className="mt-3 inline-block rounded-sm border border-warning/30 bg-warning/10 px-2 py-0.5 text-[12px] font-medium text-warning">
                {node.actionLabel}
              </span>
            )}

            {node.type === "contradiction" && node.sourceA && node.sourceB ? (
              <div className="mt-4 flex flex-col gap-3">
                <div className="rounded-md border border-border bg-surface-elevated p-3">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Source A</p>
                  <Citation source={node.sourceA} onViewSource={onViewSource} defaultExpanded />
                </div>
                <div className="rounded-md border border-border bg-surface-elevated p-3">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Source B</p>
                  <Citation source={node.sourceB} onViewSource={onViewSource} defaultExpanded />
                </div>
              </div>
            ) : node.source ? (
              <div className="mt-4">
                <Citation source={node.source} onViewSource={onViewSource} defaultExpanded />
              </div>
            ) : (
              <p className="mt-4 text-[12px] text-text-muted">General gap — no single source page</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NodeIcon({ type }: { type: VisibleGraphNodeType }) {
  const Icon = ICON[type];
  const color = GRAPH_NODE_TYPE_COLOR_VAR[type];
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm" style={{ background: `${color}1a`, color }}>
      <Icon className="h-3.5 w-3.5" />
    </div>
  );
}

function badgeVariantFor(type: VisibleGraphNodeType): "primary" | "info" | "error" | "warning" {
  switch (type) {
    case "person":
      return "primary";
    case "evidence":
      return "info";
    case "contradiction":
      return "error";
    case "missingInfo":
      return "warning";
  }
}
