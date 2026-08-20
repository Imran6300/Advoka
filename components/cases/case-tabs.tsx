"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentsPanel } from "@/components/documents/documents-panel";
import { OverviewTab } from "@/components/cases/overview-tab";
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
      <TabsList>
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

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
        <EmptyState
          icon={<Clock className="h-5 w-5 text-text-muted" />}
          title="No timeline events yet"
          description="Once your documents are analyzed, key dates and events will appear here in chronological order, each linked to its source."
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
