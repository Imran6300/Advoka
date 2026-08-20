import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/auth/getOwner";
import { getCaseForOwner } from "@/lib/db/queries/cases";
import {
  listChatMessages,
  getRecentChatHistory,
  saveUserMessage,
  saveAssistantMessage,
} from "@/lib/db/queries/chat";
import { embedText } from "@/lib/ai/embeddings";
import { searchCaseChunks } from "@/lib/ai/vectorSearch";
import { generate } from "@/lib/ai/router";
import { ChatAnswerSchema, buildChatAnswerPrompt } from "@/lib/ai/prompts/chatAnswer";
import { handleApiError, caseNotFoundResponse } from "@/lib/api/errors";

const MAX_QUESTION_LENGTH = 2000;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const owner = await getOwner();
    const caseDoc = await getCaseForOwner(owner, params.id);
    if (!caseDoc) return caseNotFoundResponse();

    const messages = await listChatMessages(owner, params.id);
    return NextResponse.json({ messages });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * architecture §7 "Ask Your Case (RAG chat)": embed the question, retrieve
 * top-k chunks scoped to this case, generate a cited answer, store as
 * ChatMessage. Deliberately synchronous (not an Inngest event, unlike
 * analysis/graph/drafting) — a single embed + retrieval + one LLM call is
 * fast enough to answer inline, and a chat interface reads far better
 * awaiting a direct response than polling for one.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const owner = await getOwner();
    const caseDoc = await getCaseForOwner(owner, params.id);
    if (!caseDoc) return caseNotFoundResponse();

    const body = await req.json().catch(() => null);
    const question = typeof body?.question === "string" ? body.question.trim() : "";

    if (!question) {
      return NextResponse.json({ error: "Ask a question to get started." }, { status: 400 });
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json({ error: "That question is too long — try breaking it up." }, { status: 400 });
    }

    const userMessage = await saveUserMessage(owner, params.id, question);

    try {
      const [history, queryEmbedding] = await Promise.all([
        getRecentChatHistory(owner, params.id),
        embedText(question),
      ]);

      const chunks = await searchCaseChunks(params.id, owner._id, queryEmbedding, 8);
      const { systemPrompt, userPrompt } = buildChatAnswerPrompt(caseDoc.title, chunks, history, question);

      const result = await generate({
        systemPrompt,
        userPrompt,
        schema: ChatAnswerSchema,
        maxTokens: 1500,
      });

      // Every claim needs a real documentId + pageNumber or it's dropped —
      // same non-negotiable as the rest of the pipeline. Only accept
      // citations that reference an excerpt actually retrieved above.
      const knownDocIds = new Set(chunks.map((c) => c.documentId));
      const citations: Array<{ documentId: string; documentName: string; page: number; excerpt: string }> = result.citations
        .filter((c) => knownDocIds.has(c.documentId))
        .map((c) => {
          const chunk = chunks.find((ch) => ch.documentId === c.documentId && ch.pageNumber === c.sourcePage);
          return {
            documentId: c.documentId,
            documentName: chunk?.documentName ?? chunks.find((ch) => ch.documentId === c.documentId)!.documentName,
            page: c.sourcePage,
            excerpt: c.excerpt,
          };
        });

      const assistantMessage = await saveAssistantMessage(owner, params.id, result.answer, citations);

      return NextResponse.json({ messages: [userMessage, assistantMessage] }, { status: 201 });
    } catch (err) {
      console.error("chat generation failed", err);
      const assistantMessage = await saveAssistantMessage(
        owner,
        params.id,
        "Advoka couldn't generate an answer just now. Please try asking again.",
        []
      );
      return NextResponse.json({ messages: [userMessage, assistantMessage] }, { status: 200 });
    }
  } catch (err) {
    return handleApiError(err);
  }
}
