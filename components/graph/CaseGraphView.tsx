"use client";

import { useMemo, useState, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import { GRAPH_NODE_TYPES_MAP, type GraphNodeData } from "@/components/graph/GraphNode";
import { GraphFilters } from "@/components/graph/GraphFilters";
import { GraphSidePanel } from "@/components/graph/GraphSidePanel";
import { layoutGraph } from "@/components/graph/graph-layout";
import { VISIBLE_GRAPH_NODE_TYPES, type VisibleGraphNodeType } from "@/lib/cases/graph-constants";
import type { CaseGraphResponse, CitationRef, GraphNodeResponse } from "@/lib/cases/graph-types";

function toReactFlowNodes(nodes: GraphNodeResponse[]): Node<GraphNodeData>[] {
  return nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: { x: 0, y: 0 }, // overwritten by layoutGraph before render
    data: { label: n.label, personRole: n.personRole },
  }));
}

function toReactFlowEdges(edges: CaseGraphResponse["edges"]): Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: false,
    style: {
      stroke: "var(--border)",
      strokeWidth: e.traceable ? 1.5 : 1.25,
      strokeDasharray: e.traceable ? undefined : "4 3",
      opacity: e.traceable ? 0.9 : 0.55,
    },
    labelStyle: { fill: "var(--text-muted)", fontSize: 11 },
    labelBgStyle: { fill: "var(--surface)" },
    labelBgPadding: [4, 2] as [number, number],
    // Untraceable (LLM-proposed, no shared source page) relationships read
    // as visibly lower-confidence per architecture §14 — dashed + faded,
    // never presented with the same certainty as a mechanically-derived edge.
    title: e.traceable ? undefined : "Possibly related — not directly traceable to a shared source",
  }));
}

export function CaseGraphView({
  nodes: rawNodes,
  edges: rawEdges,
  onViewSource,
}: {
  nodes: GraphNodeResponse[];
  edges: CaseGraphResponse["edges"];
  onViewSource?: (source: CitationRef) => void;
}) {
  const [active, setActive] = useState<Record<VisibleGraphNodeType, boolean>>({
    person: true,
    evidence: true,
    contradiction: true,
    missingInfo: true,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const nodesById = useMemo(() => new Map(rawNodes.map((n) => [n.id, n])), [rawNodes]);

  const counts = useMemo(() => {
    const c: Record<VisibleGraphNodeType, number> = { person: 0, evidence: 0, contradiction: 0, missingInfo: 0 };
    for (const n of rawNodes) c[n.type] += 1;
    return c;
  }, [rawNodes]);

  const { layoutedNodes, visibleEdges } = useMemo(() => {
    const visibleTypes = new Set(VISIBLE_GRAPH_NODE_TYPES.filter((t) => active[t]));
    const filteredNodes = rawNodes.filter((n) => visibleTypes.has(n.type));
    const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = rawEdges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));

    const rfNodes = toReactFlowNodes(filteredNodes);
    const rfEdges = toReactFlowEdges(filteredEdges);
    const positioned = layoutGraph(rfNodes, rfEdges);

    return { layoutedNodes: positioned, visibleEdges: rfEdges };
  }, [rawNodes, rawEdges, active]);

  const handleNodeClick: NodeMouseHandler = useCallback((_evt, node) => {
    setSelectedId(node.id);
  }, []);

  const toggleType = useCallback((type: VisibleGraphNodeType) => {
    setActive((prev) => ({ ...prev, [type]: !prev[type] }));
  }, []);

  const selectedNode = selectedId ? nodesById.get(selectedId) ?? null : null;

  return (
    <div className="flex flex-col gap-3">
      <GraphFilters active={active} onToggle={toggleType} counts={counts} />

      <div className="relative h-[560px] overflow-hidden rounded-lg border border-border bg-surface">
        <ReactFlowProvider>
          <ReactFlow
            nodes={layoutedNodes}
            edges={visibleEdges}
            nodeTypes={GRAPH_NODE_TYPES_MAP}
            onNodeClick={handleNodeClick}
            onPaneClick={() => setSelectedId(null)}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.3}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="var(--border)" gap={20} size={1} />
            <Controls
              showInteractive={false}
              className="!border !border-border !bg-surface-elevated [&_button]:!border-border [&_button]:!bg-surface-elevated [&_button]:!fill-text-secondary [&_button:hover]:!bg-surface"
            />
          </ReactFlow>
        </ReactFlowProvider>

        <GraphSidePanel node={selectedNode} onClose={() => setSelectedId(null)} onViewSource={onViewSource} />
      </div>
    </div>
  );
}
