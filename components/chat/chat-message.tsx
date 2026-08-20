"use client";

import { Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Citation } from "@/components/cases/citation";
import type { ChatMessageResponse } from "@/lib/cases/chat-types";
import type { CitationRef } from "@/lib/cases/analysis-types";

/**
 * Splits the assistant's plain-text answer into paragraphs and "- "
 * prefixed bullet groups — the prompt (lib/ai/prompts/chatAnswer.ts)
 * instructs the model to write it this way instead of markdown, so no
 * markdown parser is needed, just this light structural split.
 */
function AnswerBody({ content }: { content: string }) {
  const blocks: Array<{ type: "p"; text: string } | { type: "ul"; items: string[] }> = [];
  let currentList: string[] | null = null;

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      currentList = null;
      continue;
    }
    if (line.startsWith("- ")) {
      if (!currentList) {
        currentList = [];
        blocks.push({ type: "ul", items: currentList });
      }
      currentList.push(line.slice(2));
    } else {
      currentList = null;
      blocks.push({ type: "p", text: line });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {blocks.map((block, i) =>
        block.type === "p" ? (
          <p key={i} className="text-[13.5px] leading-relaxed text-text-primary">
            {block.text}
          </p>
        ) : (
          <ul key={i} className="flex flex-col gap-1 pl-4">
            {block.items.map((item, j) => (
              <li key={j} className="list-disc text-[13.5px] leading-relaxed text-text-primary marker:text-text-muted">
                {item}
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}

export function ChatMessageBubble({
  message,
  onViewSource,
}: {
  message: ChatMessageResponse;
  onViewSource: (source: CitationRef) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-[80%] items-start gap-2">
          <div className="rounded-lg rounded-tr-sm bg-primary px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white">
            {message.content}
          </div>
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-text-muted">
            <User className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="flex max-w-[85%] items-start gap-2">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ai-accent/15 text-ai-accent">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div
          className={cn(
            "flex flex-col gap-3 rounded-lg rounded-tl-sm border border-border bg-surface px-4 py-3"
          )}
        >
          <AnswerBody content={message.content} />
          {message.citations.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-border pt-2.5">
              {message.citations.map((c, i) => (
                <Citation key={i} source={c} onViewSource={onViewSource} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
