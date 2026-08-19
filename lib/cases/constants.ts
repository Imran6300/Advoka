// Shared between client (Create Case form, status badges) and server (API
// validation) — deliberately has no mongoose import so client components can
// pull it in directly.

export const CASE_TYPES = [
  "Civil Litigation",
  "Criminal Defense",
  "Family Law",
  "Employment",
  "Contract Dispute",
  "Corporate",
  "Personal Injury",
  "Real Estate",
  "Other",
] as const;

export type CaseType = (typeof CASE_TYPES)[number];

export const CASE_STATUSES = ["draft", "processing", "ready"] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  draft: "Draft",
  processing: "Processing",
  ready: "Ready",
};
