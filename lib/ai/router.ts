import { z } from "zod";

/**
 * Two-level fallback (architecture §9 / §16 phase 6):
 * Groq → Cerebras → OpenRouter → NVIDIA → Hugging Face Inference Providers.
 *
 * Within each provider, multiple models are tried in order before moving to
 * the next provider — so a single provider having a bad day (one model
 * overloaded/deprecated/rate-limited) doesn't burn the whole provider, it
 * just burns that one model. The chain only advances to the next *provider*
 * once every model on the current one has failed.
 *
 * All five providers speak the same OpenAI-compatible chat-completions
 * shape, so one `callProvider` implementation covers all of them — only
 * base URL, model list, and API key differ. A provider is skipped entirely
 * if its API key isn't configured, so local dev works with just one key set.
 *
 * Model ids below are the same ones verified live against each provider's
 * `/v1/models` in the MarginFlow project (2026-08-01) — re-verify
 * periodically, free-tier catalogs drift.
 */

interface ProviderConfig {
  name: string;
  envKey: string;
  baseUrl: string;
  /** Ordered best -> fallback models within this provider. */
  models: string[];
  /** Env var letting a deployment override/extend the model list without a code change. */
  modelEnvKey: string;
  extraHeaders?: Record<string, string>;
}

const PROVIDERS: ProviderConfig[] = [
  {
    name: "groq",
    envKey: "GROQ_API_KEY",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    modelEnvKey: "GROQ_MODEL",
    models: [
      "openai/gpt-oss-120b",
      "qwen/qwen3.6-27b",
      "openai/gpt-oss-20b",
      // Groq deprecation-notice models (shutdown ~Aug 16, 2026 per their
      // deprecations page) — kept as last-resort fallbacks within Groq.
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
    ],
  },
  {
    name: "cerebras",
    envKey: "CEREBRAS_API_KEY",
    baseUrl: "https://api.cerebras.ai/v1/chat/completions",
    modelEnvKey: "CEREBRAS_MODEL",
    // Cerebras' free-tier catalog is intentionally small — no further
    // fallback available within it beyond these three.
    models: ["gpt-oss-120b", "zai-glm-4.7", "gemma-4-31b"],
  },
  {
    name: "openrouter",
    envKey: "OPENROUTER_API_KEY",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    modelEnvKey: "OPENROUTER_MODEL",
    extraHeaders: {
      // Public leaderboard attribution only — harmless, point at your own domain.
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://advoka.in",
      "X-Title": "Advoka",
    },
    // Only ":free" ids — guarantees every call costs $0. Do not add a
    // non-":free" id here unless you're fine with it spending real credits.
    models: [
      "nvidia/nemotron-3-ultra-550b-a55b:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "openai/gpt-oss-20b:free",
      "google/gemma-4-31b-it:free",
      "nvidia/nemotron-3-nano-30b-a3b:free",
    ],
  },
  {
    name: "nvidia",
    envKey: "NVIDIA_API_KEY",
    baseUrl: "https://integrate.api.nvidia.com/v1/chat/completions",
    modelEnvKey: "NVIDIA_MODEL",
    models: [
      "nvidia/nemotron-3-ultra-550b-a55b",
      "nvidia/nemotron-3-super-120b-a12b",
      "openai/gpt-oss-120b",
      "moonshotai/kimi-k2.6",
      "meta/llama-3.3-70b-instruct",
    ],
  },
  {
    name: "huggingface",
    envKey: "HF_API_KEY",
    baseUrl: "https://router.huggingface.co/v1/chat/completions",
    modelEnvKey: "HF_MODEL",
    models: [
      "openai/gpt-oss-120b",
      "deepseek-ai/DeepSeek-V3",
      "Qwen/Qwen3-235B-A22B-Instruct-2507",
      "zai-org/GLM-4.7",
      "meta-llama/Llama-3.3-70B-Instruct",
    ],
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

/**
 * Resolves the model list to try for a provider: the env override
 * (comma-separated) if set, prepended so an operator's pinned choice is
 * tried first while still falling back to the built-in list, otherwise
 * just the built-in list.
 */
function resolveModels(provider: ProviderConfig): string[] {
  const override = process.env[provider.modelEnvKey];
  if (!override) return provider.models;

  const overridden = override
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const rest = provider.models.filter((m) => !overridden.includes(m));
  return [...overridden, ...rest];
}

async function callProvider(
  provider: ProviderConfig,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const res = await fetch(provider.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...provider.extraHeaders,
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
    throw new Error(`${provider.name}/${model} responded ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`${provider.name}/${model} returned no content`);
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
 * Walks the provider fallback chain in order. For EACH provider, walks its
 * model list in order too:
 *   - A schema-validation failure gets exactly one retry against the SAME
 *     model (a nudge, not a new attempt at understanding the task).
 *   - Any other failure (network, auth, rate limit, empty response) moves
 *     immediately to the NEXT MODEL on the same provider.
 *   - Once every model on a provider has failed, moves to the next provider.
 * Providers without an API key configured are skipped entirely, not
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

    const models = resolveModels(provider);

    for (const model of models) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const raw = await callProvider(
            provider,
            apiKey,
            model,
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

          attempts.push(
            `${provider.name}/${model} attempt ${attempt}: schema validation failed — ${
              parsed.error.issues[0]?.message ?? "invalid shape"
            }`
          );
          // Retry once against the same model on a parse/shape failure only.
          continue;
        } catch (err) {
          attempts.push(
            `${provider.name}/${model} attempt ${attempt}: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
          break; // network/API failure — move to the next model, don't retry this one.
        }
      }
      // whether it broke out (hard failure) or exhausted both attempts
      // (schema failures), move on to the next model on this provider
    }
    // All models on this provider exhausted — fall through to next provider.
  }

  throw new LLMGenerationError(
    attempts.length === 0
      ? "No LLM provider is configured. Set at least one of GROQ_API_KEY, CEREBRAS_API_KEY, OPENROUTER_API_KEY, NVIDIA_API_KEY, or HF_API_KEY."
      : "All configured LLM providers and their fallback models failed to produce a valid response.",
    attempts
  );
}