import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { Case } from "@/lib/db/models/Case";
import { CaseFact } from "@/lib/db/models/CaseFact";
import { embedText } from "@/lib/ai/embeddings";
import { searchCaseChunks } from "@/lib/ai/vectorSearch";
import { DRAFT_TEMPLATE_LABEL, type DraftTemplateType } from "@/lib/cases/analysis-constants";

const MAX_KEY_FACTS = 8;
const MAX_RELEVANT_CHUNKS = 6;

export interface DraftContext {
  caseTitle: string;
  caseType: string;
  clientName: string;
  opposingParty?: string;
  importantDate?: Date;
  summary: string | null;
  contextBlock: string;
}

/**
 * architecture §7 AI Drafting: "Each pulls relevant case context (facts +
 * optionally top-k relevant chunks) plus the lawyer's instructions."
 * Reuses the same retrieval path as chat (searchCaseChunks), querying with
 * the template type + the lawyer's instructions so the retrieved excerpts
 * are actually relevant to what's being drafted, not just the case at large.
 */
export async function buildDraftContext(
  caseId: string,
  ownerId: Types.ObjectId | string,
  templateType: DraftTemplateType,
  instructions: string
): Promise<DraftContext> {
  await connectDB();

  const [caseRecord, keyFacts] = await Promise.all([
    Case.findOne({ _id: caseId, ownerId }).lean<{
      title: string;
      caseType: string;
      clientName: string;
      opposingParty?: string;
      importantDate?: Date;
      analysis?: { summary?: string };
    }>(),
    CaseFact.find({ caseId, ownerId })
      .sort({ createdAt: 1 })
      .limit(MAX_KEY_FACTS)
      .select("type content personRole")
      .lean<Array<{ type: string; content: string; personRole?: string }>>(),
  ]);

  if (!caseRecord) {
    throw new Error(`Case ${caseId} not found for owner ${ownerId}`);
  }

  const queryText = `${DRAFT_TEMPLATE_LABEL[templateType]}. ${instructions}`;
  const queryEmbedding = await embedText(queryText);
  const relevantChunks = await searchCaseChunks(caseId, ownerId, queryEmbedding, MAX_RELEVANT_CHUNKS);

  const factsBlock = keyFacts
    .map((f) => `- (${f.type}${f.personRole ? `, ${f.personRole}` : ""}) ${f.content}`)
    .join("\n");

  const chunksBlock = relevantChunks
    .map((c) => `[Document: ${c.documentName} | Page ${c.pageNumber}]\n${c.text}`)
    .join("\n\n");

  const contextBlock = [
    keyFacts.length > 0 ? `KEY CASE FACTS:\n${factsBlock}` : "",
    relevantChunks.length > 0 ? `RELEVANT DOCUMENT EXCERPTS:\n${chunksBlock}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    caseTitle: caseRecord.title,
    caseType: caseRecord.caseType,
    clientName: caseRecord.clientName,
    opposingParty: caseRecord.opposingParty,
    importantDate: caseRecord.importantDate,
    summary: caseRecord.analysis?.summary ?? null,
    contextBlock,
  };
}
