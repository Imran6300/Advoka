import { z } from "zod";

/**
 * One abstraction, ordered fallback list (architecture §9 / §16 phase 6):
 * Groq → Cerebras → OpenRouter → Hugging Face Inference Providers.
 *
 * All four speak the same OpenAI-compatible chat-completions shape, so one
 * `callProvider` implementation covers all of them — only base URL, model,
 * and API key differ. Every provider is skipped entirely if its API key
 * isn't configured, so local dev works with just one key set.
 */

interface ProviderConfig {
  name: string;
  envKey: string;
  baseUrl: string;
  defaultModel: string;
  modelEnvKey: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    name: "groq",
    envKey: "GROQ_API_KEY",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    defaultModel: "llama-3.3-70b-versatile",
    modelEnvKey: "GROQ_MODEL",
  },
  {
    name: "cerebras",
    envKey: "CEREBRAS_API_KEY",
    baseUrl: "https://api.cerebras.ai/v1/chat/completions",
    defaultModel: "llama-3.3-70b",
    modelEnvKey: "CEREBRAS_MODEL",
  },
  {
    name: "openrouter",
    envKey: "OPENROUTER_API_KEY",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    defaultModel: "meta-llama/llama-3.3-70b-instruct:free",
    modelEnvKey: "OPENROUTER_MODEL",
  },
  {
    name: "huggingface",
    envKey: "HF_API_KEY",
    baseUrl: "https://router.huggingface.co/v1/chat/completions",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
    modelEnvKey: "HF_MODEL",
  },
];

export class LLMGenerationError extends Error {
  constructor(message: string, public readonly attempts: string[]) {
    super(message);
    this.name = "LLMGenerationError";
  }
}

export interface GenerateOptions<T> {
  /** Instructions + strict JSON-shape description. */
  systemPrompt: string;
  /** The actual case context + task for this call. */
  userPrompt: string;
  /** Every response is validated against this before being trusted. */
  schema: z.ZodType<T>;
  temperature?: number;
  maxTokens?: number;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

async function callProvider(
  provider: ProviderConfig,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const model = process.env[provider.modelEnvKey] || provider.defaultModel;

  const res = await fetch(provider.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${provider.name} responded ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`${provider.name} returned no content`);
  }
  return content;
}

/**
 * Strips markdown code fences and pulls out the first top-level JSON
 * object/array — open-weight models on free tiers frequently wrap JSON in
 * ```json fences or add a stray sentence before/after despite instructions.
 */
function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;
  const trimmed = candidate.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.search(/[{[]/);
    const end = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
    if (start === -1 || end === -1 || end < start) {
      throw new Error("No JSON object found in model output");
    }
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}

/**
 * generate(prompt, schema) → structured, Zod-validated result.
 *
 * Walks the provider fallback chain in order. For each configured provider,
 * a schema-validation failure gets exactly one retry against the *same*
 * provider (a nudge, not a new attempt at understanding the task); any
 * other failure (network, auth, rate limit) moves straight to the next
 * provider. Providers without an API key configured are skipped, not
 * counted as failures — this is what makes local dev with a single key
 * work fine.
 */
export async function generate<T>(opts: GenerateOptions<T>): Promise<T> {
  const temperature = opts.temperature ?? 0.2;
  const maxTokens = opts.maxTokens ?? 3000;
  const attempts: string[] = [];

  for (const provider of PROVIDERS) {
    const apiKey = process.env[provider.envKey];
    if (!apiKey) continue;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const raw = await callProvider(
          provider,
          apiKey,
          opts.systemPrompt,
          opts.userPrompt,
          temperature,
          maxTokens
        );
        const json = extractJson(raw);
        const parsed = opts.schema.safeParse(json);

        if (parsed.success) {
          return parsed.data;
        }

        attempts.push(`${provider.name} attempt ${attempt}: schema validation failed — ${parsed.error.issues[0]?.message ?? "invalid shape"}`);
        // Retry once against the same provider on a parse/shape failure only.
        continue;
      } catch (err) {
        attempts.push(`${provider.name} attempt ${attempt}: ${err instanceof Error ? err.message : String(err)}`);
        break; // network/API failure — move to the next provider, don't retry this one.
      }
    }
  }

  throw new LLMGenerationError(
    attempts.length === 0
      ? "No LLM provider is configured. Set at least one of GROQ_API_KEY, CEREBRAS_API_KEY, OPENROUTER_API_KEY, or HF_API_KEY."
      : `All configured LLM providers failed to produce a valid response.`,
    attempts
  );
}
