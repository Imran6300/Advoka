import dagre from "dagre";
import type { Node, Edge } from "reactflow";

export const NODE_WIDTH = 240;
export const NODE_HEIGHT = 76;

// Rough px-per-character estimate for the 11px edge label font used in
// CaseGraphView's labelStyle. Not exact (not measuring real glyph widths),
// but enough to guarantee the column gap (ranksep) is wide enough for the
// longest label in the graph to render without being clipped/overlapped by
// the neighboring node box — which is what was happening before at a fixed
// ranksep of 110px with labels like "relates to missing original document".
const LABEL_FONT_PX_PER_CHAR = 6.2;
const LABEL_HORIZONTAL_PADDING = 32; // breathing room around the label text
const MIN_RANKSEP = 110; // previous fixed value, kept as the floor
const MAX_RANKSEP = 260; // guard against runaway spacing on rare long labels

function estimateRequiredRanksep(edges: Edge[]): number {
  let longestLabelLength = 0;
  for (const edge of edges) {
    const label = typeof edge.label === "string" ? edge.label : "";
    if (label.length > longestLabelLength) longestLabelLength = label.length;
  }
  if (longestLabelLength === 0) return MIN_RANKSEP;

  const needed = longestLabelLength * LABEL_FONT_PX_PER_CHAR + LABEL_HORIZONTAL_PADDING;
  return Math.min(MAX_RANKSEP, Math.max(MIN_RANKSEP, needed));
}

/**
 * Computes x/y positions once on load via dagre — an LLM-generated graph
 * has no natural coordinates (architecture §2), so this runs before the
 * nodes are ever handed to React Flow. Zoom/pan/drag afterward is standard
 * React Flow behavior; positions are never persisted (architecture §8/§14
 * — regenerates on reload, that's fine for v1).
 */
export function layoutGraph(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "LR",
    // Widened from 56 — diagonal edges between offset rows were cutting
    // through the row above/below and colliding with that row's label text.
    nodesep: 72,
    // Dynamic instead of a fixed 110 — long edge labels ("relates to
    // missing original document", "contradicts signature authenticity")
    // were wider than the old fixed gap and got clipped by the next node.
    ranksep: estimateRequiredRanksep(edges),
    marginx: 24,
    marginy: 24,
  });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    // Nodes with no edges at all still get a dagre-assigned slot; fall back
    // to the node's existing position only if dagre somehow has no entry.
    if (!pos) return node;
    return {
      ...node,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    };
  });
}