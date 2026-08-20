import type { GraphEntityBundle } from "@/lib/graph/entities";

// Keeps the LLM relationship prompt small and cheap (same reasoning as
// caseContext.ts's MAX_CONTEXT_CHARS) — a case with more entities than this
// still gets mechanical edges for everything, just no LLM pass on the
// overflow. Ordered by creation order so earlier-extracted entities (which
// tend to be the more central ones) are prioritized.
const MAX_ENTITIES_FOR_LLM_PASS = 40;

export type GraphRefType = "person" | "evidence" | "contradiction" | "missingInfo";

export interface GraphRef {
  type: GraphRefType;
  id: string;
}

export interface EntityRefResult {
  /** ref (e.g. "p1", "e2") -> real entity, used to map LLM output back to Mongo ids. */
  refMap: Map<string, GraphRef>;
  /** Formatted list to paste into the prompt, one entity per line. */
  entitiesBlock: string;
  totalEntities: number;
}

const REF_PREFIX: Record<GraphRefType, string> = {
  person: "p",
  evidence: "e",
  contradiction: "c",
  missingInfo: "m",
};

const TYPE_LABEL: Record<GraphRefType, string> = {
  person: "PERSON",
  evidence: "EVIDENCE",
  contradiction: "CONTRADICTION",
  missingInfo: "MISSING INFO",
};

export function buildEntityRefs(entities: GraphEntityBundle): EntityRefResult {
  const refMap = new Map<string, GraphRef>();
  const lines: string[] = [];
  const counters: Record<GraphRefType, number> = { person: 0, evidence: 0, contradiction: 0, missingInfo: 0 };
  let totalEntities = 0;

  const push = (type: GraphRefType, id: string, description: string) => {
    if (refMap.size >= MAX_ENTITIES_FOR_LLM_PASS) return;
    counters[type] += 1;
    const ref = `${REF_PREFIX[type]}${counters[type]}`;
    refMap.set(ref, { type, id });
    lines.push(`[${ref}] ${TYPE_LABEL[type]}: ${description}`);
  };

  for (const person of entities.people) {
    totalEntities++;
    push("person", person.id, person.personRole ? `${person.content} (${person.personRole})` : person.content);
  }
  for (const evidence of entities.evidence) {
    totalEntities++;
    push("evidence", evidence.id, evidence.content);
  }
  for (const contradiction of entities.contradictions) {
    totalEntities++;
    push("contradiction", contradiction.id, contradiction.description);
  }
  for (const missing of entities.missingInfo) {
    totalEntities++;
    push("missingInfo", missing.id, missing.title);
  }

  return { refMap, entitiesBlock: lines.join("\n"), totalEntities };
}
