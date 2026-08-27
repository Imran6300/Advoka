import type { RetrievedChunk } from "@/lib/ai/vectorSearch";
import type { CaseAnalysisResponse, CitationRef } from "@/lib/cases/analysis-types";

/**
 * Every analysis item that DOES carry a real source (documentId + page) —
 * i.e. everything except the handful of missing-info flags that flag a
 * total absence — gets reshaped into a RetrievedChunk so it can flow
 * through the exact same excerpt-pool / citation-validation path that
 * vector-search chunks already use in the chat route. See
 * lib/ai/prompts/chatAnswer.ts for why this exists.
 */
export function chunksFromAnalysis(analysis: CaseAnalysisResponse): RetrievedChunk[] {
  const out: RetrievedChunk[] = [];

  const fromCitation = (source: CitationRef, text: string) => {
    out.push({
      documentId: source.documentId,
      documentName: source.documentName,
      pageNumber: source.page,
      text,
    });
  };

  for (const f of [...analysis.facts, ...analysis.people, ...analysis.evidence]) {
    const label = f.type === "person" ? `Person${f.personRole ? ` (${f.personRole})` : ""}` : f.type === "evidence" ? "Evidence" : "Key fact";
    fromCitation(f.source, `${label} (from Advoka's case analysis): ${f.content}`);
  }

  for (const c of analysis.contradictions) {
    fromCitation(
      c.sourceA,
      `Potential contradiction flagged by Advoka's analysis: ${c.description} — ${c.whyFlagged} (this side: "${c.sourceA.excerpt}")`
    );
    fromCitation(
      c.sourceB,
      `Potential contradiction flagged by Advoka's analysis: ${c.description} — ${c.whyFlagged} (other side: "${c.sourceB.excerpt}")`
    );
  }

  for (const m of analysis.missingInfo) {
    if (!m.source) continue; // no real page to cite — surfaced separately, see formatUncitedFindings
    fromCitation(m.source, `Missing information flagged by Advoka's analysis: ${m.title} — ${m.description}`);
  }

  for (const t of analysis.timeline) {
    const when = t.date ? ` (${t.date.slice(0, 10)})` : "";
    fromCitation(t.source, `Timeline event${when} (from Advoka's case analysis): ${t.description}`);
  }

  for (const d of analysis.deadlines) {
    fromCitation(d.source, `Deadline due ${d.dueDate.slice(0, 10)} (from Advoka's case analysis): ${d.description}`);
  }

  return out;
}
