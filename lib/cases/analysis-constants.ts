// Shared between client (processing checklist, Overview tab) and server
// (Inngest progress writes, API responses) — no mongoose import, same
// reasoning as lib/cases/constants.ts.

export const ANALYSIS_STATUSES = ["not_started", "processing", "ready", "failed"] as const;
export type AnalysisStatus = (typeof ANALYSIS_STATUSES)[number];

export const STEP_STATES = ["pending", "active", "done", "failed"] as const;
export type StepState = (typeof STEP_STATES)[number];

// §9 AI processing experience — the six-item checklist is a named trust
// moment in the design doc; keep this order in sync with the literal
// checklist example (✓ Documents received / ✓ Text extracted / ✓ Documents
// indexed / ● Finding key facts / ○ Detecting contradictions / ○ Building
// timeline) and with the Inngest steps in inngest/functions/caseAnalysis.ts.
export const ANALYSIS_STEP_KEYS = [
  "documentsReceived",
  "textExtracted",
  "documentsIndexed",
  "findingFacts",
  "detectingContradictions",
  "buildingTimeline",
] as const;
export type AnalysisStepKey = (typeof ANALYSIS_STEP_KEYS)[number];

export const ANALYSIS_STEP_LABEL: Record<AnalysisStepKey, string> = {
  documentsReceived: "Documents received",
  textExtracted: "Text extracted",
  documentsIndexed: "Documents indexed",
  findingFacts: "Finding key facts",
  detectingContradictions: "Detecting contradictions",
  buildingTimeline: "Building timeline",
};

export type AnalysisSteps = Record<AnalysisStepKey, StepState>;

export function initialAnalysisSteps(): AnalysisSteps {
  return {
    documentsReceived: "pending",
    textExtracted: "pending",
    documentsIndexed: "pending",
    findingFacts: "pending",
    detectingContradictions: "pending",
    buildingTimeline: "pending",
  };
}

export const CASE_FACT_TYPES = ["fact", "person", "evidence"] as const;
export type CaseFactType = (typeof CASE_FACT_TYPES)[number];

export const DRAFT_TEMPLATE_TYPES = [
  "legal_notice",
  "client_email",
  "case_summary",
  "reply_to_notice",
  "application",
] as const;
export type DraftTemplateType = (typeof DRAFT_TEMPLATE_TYPES)[number];
