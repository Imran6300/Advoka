import { z } from "zod";
import { HEDGED_LANGUAGE_RULE, JSON_ONLY_RULE } from "@/lib/ai/prompts/shared";

export const GraphRelationshipItemSchema = z.object({
  sourceRef: z.string().min(1).max(10),
  targetRef: z.string().min(1).max(10),
  relationshipLabel: z.string().min(1).max(60),
});

export const GraphRelationshipsSchema = z.object({
  relationships: z.array(GraphRelationshipItemSchema).max(60),
});

export type GraphRelationshipsResult = z.infer<typeof GraphRelationshipsSchema>;

/**
 * architecture §7 Case Graph Builder LLM pass: "given these people,
 * evidence items, contradictions, and missing-info flags, identify which
 * are related, and label the relationship in a few words." Reference by
 * the short ids passed in (never free text), so the caller can map back to
 * real `_id`s deterministically. Cheap, 100%-reliable edges (contradiction↔
 * person, evidence↔person on the same page) are already computed
 * mechanically before this ever runs — this pass is reserved for the
 * relationships that actually need judgment (e.g. "Person A's testimony
 * conflicts with Evidence B").
 */
export function buildGraphRelationshipsPrompt(entitiesBlock: string, caseTitle: string) {
  const systemPrompt = `You are Advoka, an AI legal case analyst. Your task right now is narrow: identify meaningful RELATIONSHIPS between the case entities listed below (people, evidence, contradictions, and missing-information flags) and label each relationship in a few words (e.g. "gave statement about", "conflicts with", "relates to missing document", "witnessed by"). ${HEDGED_LANGUAGE_RULE} ${JSON_ONLY_RULE}

Return a JSON object with exactly this key:
{
  "relationships": [
    { "sourceRef": string, "targetRef": string, "relationshipLabel": string }
  ]
}

Rules:
- "sourceRef" and "targetRef" MUST be copied verbatim from the reference ids in brackets (e.g. "p1", "e2", "c1", "m1") in the entity list below. Never invent a ref that isn't listed.
- sourceRef and targetRef must always refer to two different entities — never link an entity to itself.
- Only report a relationship you can reasonably infer from the entities' descriptions below — don't guess connections that aren't supported by what's written.
- Favor relationships between different entity types (e.g. a person and a piece of evidence, or a person and a contradiction) over relationships within the same type, since those are more useful for a lawyer trying to see the shape of the case.
- Keep "relationshipLabel" short — a few words, not a sentence.
- If there are no clear additional relationships beyond the obvious, return an empty array. Do not force it.`;

  const userPrompt = `Case: ${caseTitle}\n\n--- CASE ENTITIES (each tagged with a reference id — copy it exactly when citing a relationship) ---\n${entitiesBlock}\n--- END CASE ENTITIES ---\n\nIdentify genuine relationships between the entities above and produce the JSON object described in the system instructions.`;

  return { systemPrompt, userPrompt };
}
