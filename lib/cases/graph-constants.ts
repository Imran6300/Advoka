// Shared between client (GraphNode renderers, GraphFilters) and server
// (graph builder, GraphEdge schema) — no mongoose import, same reasoning as
// lib/cases/analysis-constants.ts.
//
// Architecture §4 includes "fact" as a valid GraphEdge sourceType/targetType
// for schema flexibility, but §8's UI spec only defines four node colors —
// plain facts (type: "fact" CaseFacts) are never rendered as graph nodes in
// this MVP, only referenced here so the edge schema stays true to the spec.
export const GRAPH_NODE_TYPES = ["person", "evidence", "contradiction", "missingInfo", "fact"] as const;
export type GraphNodeType = (typeof GRAPH_NODE_TYPES)[number];

// The four node types actually rendered in the Case Graph view (§8).
export const VISIBLE_GRAPH_NODE_TYPES = ["person", "evidence", "contradiction", "missingInfo"] as const;
export type VisibleGraphNodeType = (typeof VISIBLE_GRAPH_NODE_TYPES)[number];

export const GRAPH_NODE_TYPE_LABEL: Record<VisibleGraphNodeType, string> = {
  person: "Person",
  evidence: "Evidence",
  contradiction: "Contradiction",
  missingInfo: "Missing Information",
};

// §8 node types (color-coded, consistent across the app): Person
// indigo/blue, Evidence sky, Contradiction rose, Missing Info amber —
// mapped onto the design system's existing semantic tokens rather than new
// ad-hoc colors (primary=indigo, info=sky, error=rose, warning=amber).
export const GRAPH_NODE_TYPE_COLOR_VAR: Record<VisibleGraphNodeType, string> = {
  person: "var(--primary)",
  evidence: "var(--info)",
  contradiction: "var(--error)",
  missingInfo: "var(--warning)",
};

// A case needs at least this many nodes AND at least one edge before the
// graph is considered worth rendering — otherwise show the sparse/empty
// state per architecture §8 ("Not enough cross-referenced entities yet —
// upload more documents") rather than a lonely, broken-looking 2-node graph.
export const MIN_GRAPH_NODES_TO_RENDER = 3;
