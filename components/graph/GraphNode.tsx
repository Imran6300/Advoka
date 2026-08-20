"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { User, FileCheck, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { GRAPH_NODE_TYPE_COLOR_VAR, type VisibleGraphNodeType } from "@/lib/cases/graph-constants";

export interface GraphNodeData {
  label: string;
  personRole?: string;
}

const ICON: Record<VisibleGraphNodeType, React.ElementType> = {
  person: User,
  evidence: FileCheck,
  contradiction: AlertTriangle,
  missingInfo: AlertCircle,
};

/**
 * Shared node shell for all four types — a plain rounded card, colored
 * left rail + icon per type, dashed border for missing-info nodes so it
 * visually reads as "incomplete" rather than "confirmed" (§8). Both
 * handles render on every node (Left/Right, matching the LR dagre layout)
 * so edges connect regardless of which side a given relationship treats as
 * "source" — that distinction isn't meaningful to a lawyer reading the
 * graph, only the label is.
 */
function BaseNode({ type, data, selected }: { type: VisibleGraphNodeType; data: GraphNodeData; selected?: boolean }) {
  const Icon = ICON[type];
  const colorVar = GRAPH_NODE_TYPE_COLOR_VAR[type];
  const dashed = type === "missingInfo";

  return (
    <div
      className={cn(
        "flex w-[240px] items-start gap-2.5 rounded-md border bg-surface p-3 shadow-sm transition-all duration-hover ease-advoka",
        dashed ? "border-dashed" : "border-solid",
        selected ? "ring-2 ring-offset-2 ring-offset-background" : ""
      )}
      style={{
        borderColor: `${colorVar}55`,
        boxShadow: selected ? `0 0 0 1px ${colorVar}` : undefined,
      }}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-none" style={{ background: colorVar }} />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-none" style={{ background: colorVar }} />

      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm"
        style={{ background: `${colorVar}1a`, color: colorVar }}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[12.5px] leading-snug text-text-primary">{data.label}</p>
        {data.personRole && (
          <Badge variant="primary" className="mt-1">
            {data.personRole}
          </Badge>
        )}
      </div>
    </div>
  );
}

export const PersonNode = memo((props: NodeProps<GraphNodeData>) => (
  <BaseNode type="person" data={props.data} selected={props.selected} />
));
PersonNode.displayName = "PersonNode";

export const EvidenceNode = memo((props: NodeProps<GraphNodeData>) => (
  <BaseNode type="evidence" data={props.data} selected={props.selected} />
));
EvidenceNode.displayName = "EvidenceNode";

export const ContradictionNode = memo((props: NodeProps<GraphNodeData>) => (
  <BaseNode type="contradiction" data={props.data} selected={props.selected} />
));
ContradictionNode.displayName = "ContradictionNode";

export const MissingInfoNode = memo((props: NodeProps<GraphNodeData>) => (
  <BaseNode type="missingInfo" data={props.data} selected={props.selected} />
));
MissingInfoNode.displayName = "MissingInfoNode";

export const GRAPH_NODE_TYPES_MAP = {
  person: PersonNode,
  evidence: EvidenceNode,
  contradiction: ContradictionNode,
  missingInfo: MissingInfoNode,
};
