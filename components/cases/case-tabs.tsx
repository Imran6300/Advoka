"use client";

import { useCallback, useState } from "react";
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

type TabValue = (typeof TABS)[number]["value"];

// Perf pass — Radix unmounts a TabsContent's children the instant it stops
// being the active tab, which meant every tab switch threw away and
// re-fetched that tab's data from scratch: Chat re-fetched its whole
// history, the Graph tab re-ran dagre's layout, Drafts lost any in-progress
// generation step's scroll position, and the case summary re-rendered from
// an empty skeleton every time. `forceMount` keeps a tab's content in the
// DOM (hidden via `data-[state=inactive]:hidden` in ui/tabs.tsx) once it's
// been opened at least once, so switching back to it is instant and does no
// network or layout work — while a tab that's never been opened still isn't
// mounted at all, so it never fires its data fetch until the lawyer actually
// clicks it. The data-fetching hooks behind these tabs (use-case-analysis,
// use-case-graph) were moved onto React Query specifically so that keeping
// multiple tabs mounted at once shares one polling request per resource
// instead of each tab running its own duplicate interval.
export function CaseTabs({
  caseId,
  initialStatus,
  initialAnalysis,
  hasExtractedDocuments,
}: {
  caseId: string;
  initialStatus: CaseStatusResponse;
  initialAnalysis: CaseAnalysisResponse | null;
  // §Bugfix — this used to be computed internally from the static
  // `initialStatus` server prop and never updated, so Overview/Timeline/
  // Graph/Chat kept showing "no documents yet" even after a document
  // actually finished extracting, until a full page reload. The caller
  // (CaseDetailShell) now derives this from its live status poll and
  // passes the current value down every render.
  hasExtractedDocuments: boolean;
}) {
  const [activeTab, setActiveTab] = useState<TabValue>("overview");
  const [visitedTabs, setVisitedTabs] = useState<Set<TabValue>>(() => new Set<TabValue>(["overview"]));

  const handleTabChange = useCallback((value: string) => {
    const next = value as TabValue;
    setActiveTab(next);
    setVisitedTabs((prev) => (prev.has(next) ? prev : new Set(prev).add(next)));
  }, []);

  const goToTab = useCallback(
    (value: TabValue) => {
      handleTabChange(value);
    },
    [handleTabChange]
  );

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col gap-4">
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

      <TabsContent value="overview" forceMount={visitedTabs.has("overview") || undefined}>
        {visitedTabs.has("overview") && (
          <OverviewTab
            caseId={caseId}
            hasExtractedDocuments={hasExtractedDocuments}
            initialAnalysis={initialAnalysis}
            onNavigateToDocuments={() => goToTab("documents")}
          />
        )}
      </TabsContent>

      <TabsContent value="documents" forceMount={visitedTabs.has("documents") || undefined}>
        {visitedTabs.has("documents") && <DocumentsPanel caseId={caseId} initialStatus={initialStatus} />}
      </TabsContent>

      <TabsContent value="timeline" forceMount={visitedTabs.has("timeline") || undefined}>
        {visitedTabs.has("timeline") && (
          <TimelineTab
            caseId={caseId}
            hasExtractedDocuments={hasExtractedDocuments}
            initialAnalysis={initialAnalysis}
            onNavigateToDocuments={() => goToTab("documents")}
            onNavigateToOverview={() => goToTab("overview")}
          />
        )}
      </TabsContent>

      <TabsContent value="graph" forceMount={visitedTabs.has("graph") || undefined}>
        {visitedTabs.has("graph") && (
          <GraphTab
            caseId={caseId}
            hasExtractedDocuments={hasExtractedDocuments}
            initialAnalysisStatus={initialAnalysis?.status ?? "not_started"}
            onNavigateToOverview={() => goToTab("overview")}
            onNavigateToDocuments={() => goToTab("documents")}
          />
        )}
      </TabsContent>

      <TabsContent value="chat" forceMount={visitedTabs.has("chat") || undefined}>
        {visitedTabs.has("chat") && (
          <ChatTab
            caseId={caseId}
            hasExtractedDocuments={hasExtractedDocuments}
            onNavigateToDocuments={() => goToTab("documents")}
          />
        )}
      </TabsContent>

      <TabsContent value="drafts" forceMount={visitedTabs.has("drafts") || undefined}>
        {visitedTabs.has("drafts") && <DraftsTab caseId={caseId} />}
      </TabsContent>
    </Tabs>
  );
}
