"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChatMessageResponse } from "@/lib/cases/chat-types";

export function useCaseChat(caseId: string) {
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/cases/${caseId}/chat`, { cache: "no-store" });
        if (!res.ok) return;
        const data: { messages: ChatMessageResponse[] } = await res.json();
        if (!cancelled) setMessages(data.messages);
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  const sendQuestion = useCallback(
    async (question: string) => {
      setIsSending(true);
      setError(null);
      // Optimistic — show the lawyer's question immediately, the "thinking"
      // state below carries the wait for the assistant's structured answer.
      const optimisticId = `pending-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { _id: optimisticId, role: "user", content: question, citations: [], createdAt: new Date().toISOString() },
      ]);

      try {
        const res = await fetch(`/api/cases/${caseId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setMessages((prev) => prev.filter((m) => m._id !== optimisticId));
          setError(data?.error ?? "Advoka couldn't answer that just now. Please try again.");
          return;
        }

        setMessages((prev) => [...prev.filter((m) => m._id !== optimisticId), ...data.messages]);
      } catch {
        setMessages((prev) => prev.filter((m) => m._id !== optimisticId));
        setError("Advoka couldn't answer that just now. Please try again.");
      } finally {
        setIsSending(false);
      }
    },
    [caseId]
  );

  return { messages, isLoadingHistory, isSending, error, sendQuestion };
}
