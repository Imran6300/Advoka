import type { DraftTemplateType, DraftStatus } from "@/lib/cases/analysis-constants";

export interface DraftResponse {
  _id: string;
  templateType: DraftTemplateType;
  instructions: string;
  content: string;
  status: DraftStatus;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}
