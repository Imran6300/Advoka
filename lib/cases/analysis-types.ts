import type { AnalysisStatus, AnalysisSteps, CaseFactType } from "@/lib/cases/analysis-constants";

export interface CitationRef {
  documentId: string;
  documentName: string;
  page: number;
  excerpt: string;
}

export interface FactItemResponse {
  _id: string;
  type: CaseFactType;
  content: string;
  personRole?: string;
  source: CitationRef;
}

export interface ContradictionResponse {
  _id: string;
  description: string;
  whyFlagged: string;
  sourceA: CitationRef;
  sourceB: CitationRef;
  reviewed: boolean;
}

export interface MissingInfoResponse {
  _id: string;
  title: string;
  description: string;
  actionLabel: string;
  source: CitationRef | null;
}

export interface TimelineEventResponse {
  _id: string;
  date: string | null;
  description: string;
  source: CitationRef;
}

export interface DeadlineResponse {
  _id: string;
  description: string;
  dueDate: string;
  source: CitationRef;
}

export interface CaseAnalysisResponse {
  status: AnalysisStatus;
  steps: AnalysisSteps;
  summary: string | null;
  error: string | null;
  facts: FactItemResponse[];
  evidence: FactItemResponse[];
  people: FactItemResponse[];
  contradictions: ContradictionResponse[];
  missingInfo: MissingInfoResponse[];
  timeline: TimelineEventResponse[];
  deadlines: DeadlineResponse[];
}
