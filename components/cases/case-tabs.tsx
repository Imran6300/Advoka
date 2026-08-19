"use client";

import { useState } from "react";
import {
  MessageSquare,
  Network,
  PenLine,
  Sparkles,
  UploadCloud,
  Clock,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentsPanel } from "@/components/documents/documents-panel";
import type { CaseStatusResponse } from "@/lib/hooks/use-case-status";

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
}: {
  caseId: string;
  initialStatus: CaseStatusResponse;
}) {
  const [activeTab, setActiveTab] = useState<string>("overview");

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
        <EmptyState
          icon={<Sparkles className="h-5 w-5 text-text-muted" />}
          title="No case intelligence yet"
          description="Upload documents and Advoka will generate an AI summary, key facts, contradictions, missing information, and a timeline — every claim backed by a source."
          action={
            <Button variant="ai" onClick={() => setActiveTab("documents")}>
              <UploadCloud className="h-4 w-4" />
              Upload Documents
            </Button>
          }
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
        <EmptyState
          icon={<Network className="h-5 w-5 text-text-muted" />}
          title="Not enough cross-referenced entities yet"
          description="Upload more documents so Advoka can map the people, evidence, and contradictions in this case."
        />
      </TabsContent>

      <TabsContent value="chat">
        <EmptyState
          icon={<MessageSquare className="h-5 w-5 text-text-muted" />}
          title="Ask Advoka about this case"
          description="Once documents are uploaded and analyzed, ask questions and get answers cited straight to the source page."
        />
      </TabsContent>

      <TabsContent value="drafts">
        <EmptyState
          icon={<PenLine className="h-5 w-5 text-text-muted" />}
          title="No drafts yet"
          description="Generate a legal notice, client email, case summary, or reply from a template once your case has been analyzed."
        />
      </TabsContent>
    </Tabs>
  );
}
