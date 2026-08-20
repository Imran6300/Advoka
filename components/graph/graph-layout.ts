import dagre from "dagre";
import type { Node, Edge } from "reactflow";

export const NODE_WIDTH = 240;
export const NODE_HEIGHT = 76;

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
  g.setGraph({ rankdir: "LR", nodesep: 56, ranksep: 110, marginx: 24, marginy: 24 });

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
