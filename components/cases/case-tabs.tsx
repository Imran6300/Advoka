"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentsPanel } from "@/components/documents/documents-panel";
import { OverviewTab } from "@/components/cases/overview-tab";
import { TimelineTab } from "@/components/cases/timeline-tab";
import { GraphTab } from "@/components/cases/graph-tab";
import { ChatTab } from "@/components/chat/chat-panel";
import { DraftsTab } from "@/components/cases/drafts-tab";
import type { CaseStatusResponse } from "@/lib/hooks/use-case-status";
import type { CaseAnalysisResponse } from "@/lib/cases/analysis-types";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "documents", label: "Documents" },
  { value: "timeline", label: "Timeline" },
  { value: "graph", label: "Graph" },
  { value: "chat", label: "Chat" },
  { value: "drafts", label: "Drafts" },
] as const;

export function CaseTabs({
  caseId,
  initialStatus,
  initialAnalysis,
}: {
  caseId: string;
  initialStatus: CaseStatusResponse;
  initialAnalysis: CaseAnalysisResponse | null;
}) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const hasExtractedDocuments = initialStatus.documents.some((d) => d.status === "extracted");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-4">
      {/* §26 Responsive pass — six tabs don't fit a phone-width TabsList; let
          the bar scroll horizontally there instead of wrapping or clipping. */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
        <TabsList className="w-max">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="overview">
        <OverviewTab
          caseId={caseId}
          hasExtractedDocuments={hasExtractedDocuments}
          initialAnalysis={initialAnalysis}
          onNavigateToDocuments={() => setActiveTab("documents")}
        />
      </TabsContent>

      <TabsContent value="documents">
        <DocumentsPanel caseId={caseId} initialStatus={initialStatus} />
      </TabsContent>

      <TabsContent value="timeline">
        <TimelineTab
          caseId={caseId}
          hasExtractedDocuments={hasExtractedDocuments}
          initialAnalysis={initialAnalysis}
          onNavigateToDocuments={() => setActiveTab("documents")}
          onNavigateToOverview={() => setActiveTab("overview")}
        />
      </TabsContent>

      <TabsContent value="graph">
        <GraphTab
          caseId={caseId}
          hasExtractedDocuments={hasExtractedDocuments}
          initialAnalysisStatus={initialAnalysis?.status ?? "not_started"}
          onNavigateToOverview={() => setActiveTab("overview")}
          onNavigateToDocuments={() => setActiveTab("documents")}
        />
      </TabsContent>

      <TabsContent value="chat">
        <ChatTab
          caseId={caseId}
          hasExtractedDocuments={hasExtractedDocuments}
          onNavigateToDocuments={() => setActiveTab("documents")}
        />
      </TabsContent>

      <TabsContent value="drafts">
        <DraftsTab caseId={caseId} />
      </TabsContent>
    </Tabs>
  );
}
