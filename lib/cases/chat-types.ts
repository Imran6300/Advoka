import type { CitationRef } from "@/lib/cases/analysis-types";

export interface ChatMessageResponse {
  _id: string;
  role: "user" | "assistant";
  content: string;
  citations: CitationRef[];
  createdAt: string;
}
