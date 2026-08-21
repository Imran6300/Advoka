"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AIDotWave } from "@/components/ui/ai-loader";
import { ChatMessageBubble } from "@/components/chat/chat-message";
import { useCaseChat } from "@/lib/hooks/use-case-chat";
import type { CitationRef } from "@/lib/cases/analysis-types";

const SUGGESTED_QUESTIONS = [
  "What are the key facts in this case?",
  "Summarize the timeline of events",
  "Are there any contradictions in the evidence?",
  "What information is still missing?",
];

export function ChatTab({
  caseId,
  hasExtractedDocuments,
  onNavigateToDocuments,
}: {
  caseId: string;
  hasExtractedDocuments: boolean;
  onNavigateToDocuments: () => void;
}) {
  const { messages, isLoadingHistory, isSending, error, sendQuestion } = useCaseChat(caseId);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  // Stable identity (perf pass) — passed into every memoized ChatMessageBubble.
  const handleViewSource = useCallback(
    (_source: CitationRef) => onNavigateToDocuments(),
    [onNavigateToDocuments]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || isSending) return;
    setInput("");
    sendQuestion(question);
  };

  if (!hasExtractedDocuments) {
    return (
      <EmptyState
        icon={<Sparkles className="h-5 w-5 text-ai-accent" />}
        title="Upload documents to start asking questions"
        description="Advoka answers questions using the documents in this case, with citations back to the source. Upload something first."
        action={
          <button
            type="button"
            onClick={onNavigateToDocuments}
            className="text-[13px] font-medium text-primary hover:underline"
          >
            Go to Documents
          </button>
        }
      />
    );
  }

  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-[14px] font-semibold text-text-primary">Ask Advoka about this case</h3>
        <p className="text-[12.5px] text-text-muted">Answers are based on the documents uploaded to this case.</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {isLoadingHistory ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-16 w-2/3 rounded-lg" />
            <Skeleton className="ml-auto h-10 w-1/2 rounded-lg" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ai-accent/15 text-ai-accent">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-[13px] text-text-muted">Ask anything about this case's documents to get started.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendQuestion(q)}
                  className="rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-[12.5px] text-text-secondary transition-colors duration-hover ease-advoka hover:border-primary/40 hover:text-text-primary"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <ChatMessageBubble message={m} onViewSource={handleViewSource} />
                </motion.div>
              ))}
            </AnimatePresence>
            {isSending && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                className="flex items-center gap-2.5 pl-8 text-[12.5px] text-text-muted"
              >
                <AIDotWave />
                Advoka is reading the case documents
              </motion.div>
            )}
          </div>
        )}
      </div>

      {error && <p className="border-t border-border px-4 py-2 text-[12.5px] text-error">{error}</p>}

      <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-border p-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Ask a question about this case…"
          rows={1}
          className="max-h-32 min-h-[40px] resize-none"
        />
        <Button type="submit" size="icon" disabled={!input.trim() || isSending} aria-label="Send question">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
