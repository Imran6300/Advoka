import type { AnalysisStatus } from "@/lib/cases/analysis-constants";
import type { CaseStatus } from "@/lib/cases/constants";
import type { CitationRef } from "@/lib/cases/analysis-types";
import type { VisibleGraphNodeType } from "@/lib/cases/graph-constants";

export type { CitationRef };

export interface GraphNodeResponse {
  /** `${type}:${realMongoId}` — unique across all four entity collections, used as the React Flow node id. */
  id: string;
  type: VisibleGraphNodeType;
  /** Short label shown on the node itself. */
  label: string;
  /** Full text shown in the side panel. */
  description: string;
  /** Person nodes only (e.g. "Witness", "Accused"). */
  personRole?: string;
  /** Primary citation — every type except contradiction (which has two, below). */
  source?: CitationRef | null;
  /** Contradiction nodes only — both conflicting excerpts, shown side by side in the side panel. */
  sourceA?: CitationRef;
  sourceB?: CitationRef;
  whyFlagged?: string;
  /** Missing-info nodes only. */
  actionLabel?: string;
}

export interface GraphEdgeResponse {
  id: string;
  source: string;
  target: string;
  label: string;
  /** True when this edge has a real source document + page behind it (mechanical edges always do; LLM-proposed relationships without one render as visibly lower-confidence, per architecture §14). */
  traceable: boolean;
  sourceCitation?: CitationRef;
}

export interface CaseGraphResponse {
  /** Case.analysis.status — drives which empty/loading state the Graph tab shows. */
  analysisStatus: AnalysisStatus;
  /** Case.status — flips to "ready" only once the graph-build step finishes (architecture §7), even after analysis itself is "ready". */
  caseStatus: CaseStatus;
  nodes: GraphNodeResponse[];
  edges: GraphEdgeResponse[];
}
