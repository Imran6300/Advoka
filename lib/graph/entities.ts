/**
 * The shape every graph-building step (mechanical edges, LLM ref-mapping,
 * node/edge assembly) works from — plain data pulled out of Mongo once at
 * the top of the Inngest function, not re-queried per step.
 */
export interface GraphPerson {
  id: string;
  content: string;
  personRole?: string;
  sourceDocumentId: string;
  sourcePage: number;
}

export interface GraphEvidence {
  id: string;
  content: string;
  sourceDocumentId: string;
  sourcePage: number;
}

export interface GraphContradiction {
  id: string;
  description: string;
  sourceA: { documentId: string; page: number };
  sourceB: { documentId: string; page: number };
}

export interface GraphMissingInfo {
  id: string;
  title: string;
  sourceDocumentId?: string;
  sourcePage?: number;
}

export interface GraphEntityBundle {
  people: GraphPerson[];
  evidence: GraphEvidence[];
  contradictions: GraphContradiction[];
  missingInfo: GraphMissingInfo[];
}

export interface DraftEdge {
  sourceType: "person" | "evidence" | "contradiction" | "missingInfo";
  sourceId: string;
  targetType: "person" | "evidence" | "contradiction" | "missingInfo";
  targetId: string;
  relationshipLabel: string;
  sourceDocumentId?: string;
  sourcePage?: number;
}

function edgeKey(e: Pick<DraftEdge, "sourceType" | "sourceId" | "targetType" | "targetId">): string {
  // Undirected dedupe key — a↔b and b↔a are the same relationship for our
  // purposes (React Flow renders a single connecting line either way).
  const a = `${e.sourceType}:${e.sourceId}`;
  const b = `${e.targetType}:${e.targetId}`;
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Mechanical edges — architecture §7: "add a few relationships without an
 * LLM call, cheaply and reliably from data you already have: every
 * Contradiction automatically gets edges to whichever person its two
 * sources mention; every Evidence item automatically gets an edge to any
 * Person mentioned on the same source page." These are trustworthy by
 * construction (real sourceDocumentId + sourcePage) and cost nothing.
 */
export function buildMechanicalEdges(entities: GraphEntityBundle): DraftEdge[] {
  const edges: DraftEdge[] = [];
  const seen = new Set<string>();

  const add = (edge: DraftEdge) => {
    const key = edgeKey(edge);
    if (seen.has(key)) return;
    seen.add(key);
    edges.push(edge);
  };

  for (const evidence of entities.evidence) {
    for (const person of entities.people) {
      if (evidence.sourceDocumentId === person.sourceDocumentId && evidence.sourcePage === person.sourcePage) {
        add({
          sourceType: "evidence",
          sourceId: evidence.id,
          targetType: "person",
          targetId: person.id,
          relationshipLabel: "associated with",
          sourceDocumentId: evidence.sourceDocumentId,
          sourcePage: evidence.sourcePage,
        });
      }
    }
  }

  for (const contradiction of entities.contradictions) {
    for (const person of entities.people) {
      const matchesA =
        contradiction.sourceA.documentId === person.sourceDocumentId &&
        contradiction.sourceA.page === person.sourcePage;
      const matchesB =
        contradiction.sourceB.documentId === person.sourceDocumentId &&
        contradiction.sourceB.page === person.sourcePage;
      if (matchesA || matchesB) {
        const match = matchesA ? contradiction.sourceA : contradiction.sourceB;
        add({
          sourceType: "contradiction",
          sourceId: contradiction.id,
          targetType: "person",
          targetId: person.id,
          relationshipLabel: "involves",
          sourceDocumentId: match.documentId,
          sourcePage: match.page,
        });
      }
    }
  }

  return edges;
}

export { edgeKey };
