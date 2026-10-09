import { z } from "zod";

/**
 * Multi-provider LLM router with per-model fallback.
 *
 * Speed fixes vs the previous version:
 *  1. Provider order is configurable (LLM_PROVIDER_ORDER) and defaults to the
 *     FAST inference hosts first (groq, cerebras) — the old array had slow
 *     free-queue OpenRouter models first, contradicting its own comment.
 *  2. A hard per-call deadline (LLM_DEADLINE_MS, default 45s). The old chain
 *     could walk many 15s timeouts and get killed by Vercel's 60s limit, which
 *     made Inngest retry the whole step from scratch.
 *  3. Circuit breaker: a model/provider that just failed (429, 5xx, timeout,
 *     bad key, decommissioned) is skipped for a cooldown, so the three
 *     analysis calls + graph + chat don't each re-walk the same dead models.
 *  4. Reasoning effort is set to "low" on gpt-oss models — extraction does not
 *     need long hidden reasoning, and reasoning tokens dominate latency.
 *  5. Optional params (response_format / reasoning) are dropped automatically
 *     if a provider rejects them with a 400.
 *  6. Schema-failure retry now tells the model what was wrong.
 */

interface ProviderConfig {
  name: string;
  envKey: string;
  baseUrl: string;
  models: string[];
  modelEnvKey: string;
  /** Per-attempt timeout. Fast hosts get less, slow free queues more. */
  timeoutMs: number;
  extraHeaders?: Record<string, string>;
}

const PROVIDER_DEFS: ProviderConfig[] = [
  {
    name: "openrouter",
    envKey: "OPENROUTER_API_KEY",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    modelEnvKey: "OPENROUTER_MODEL",
    timeoutMs: 30_000,
    extraHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://advoka.in",
      "X-Title": "Advoka",
    },
    // Only ":free" ids — every call costs $0.
    models: [
      "stealth/ox-alpha",
      "nvidia/nemotron-3-ultra-550b-a55b:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "openai/gpt-oss-20b:free",
      "google/gemma-4-31b-it:free",
      "nvidia/nemotron-3-nano-30b-a3b:free",
    ],
  },
  {
    name: "groq",
    envKey: "GROQ_API_KEY",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    modelEnvKey: "GROQ_MODEL",
    timeoutMs: 20_000,
    models: [
      "openai/gpt-oss-120b",
      "qwen/qwen3.6-27b",
      "openai/gpt-oss-20b",
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
    ],
  },
  {
    name: "cerebras",
    envKey: "CEREBRAS_API_KEY",
    baseUrl: "https://api.cerebras.ai/v1/chat/completions",
    modelEnvKey: "CEREBRAS_MODEL",
    timeoutMs: 20_000,
    models: ["gpt-oss-120b", "zai-glm-4.7", "gemma-4-31b"],
  },
  {
    name: "nvidia",
    envKey: "NVIDIA_API_KEY",
    baseUrl: "https://integrate.api.nvidia.com/v1/chat/completions",
    modelEnvKey: "NVIDIA_MODEL",
    timeoutMs: 30_000,
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
    timeoutMs: 30_000,
    models: [
      "openai/gpt-oss-120b",
      "deepseek-ai/DeepSeek-V3",
      "Qwen/Qwen3-235B-A22B-Instruct-2507",
      "zai-org/GLM-4.7",
      "meta-llama/Llama-3.3-70B-Instruct",
    ],
  },
];

const DEFAULT_ORDER = ["groq", "cerebras", "openrouter", "nvidia", "huggingface"];

function orderedProviders(): ProviderConfig[] {
  const raw = process.env.LLM_PROVIDER_ORDER;
  const order = raw
    ? raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : DEFAULT_ORDER;
  const byName = new Map(PROVIDER_DEFS.map((p) => [p.name, p]));
  const picked = order.map((n) => byName.get(n)).filter((p): p is ProviderConfig => !!p);
  // Anything not listed still goes last so a typo can't disable a provider.
  const rest = PROVIDER_DEFS.filter((p) => !picked.includes(p));
  return [...picked, ...rest];
}

const DEFAULT_DEADLINE_MS = Number(process.env.LLM_DEADLINE_MS) || 45_000;
const MIN_ATTEMPT_MS = 4_000;
const MIN_RETRY_BUDGET_MS = 12_000;

export class LLMGenerationError extends Error {
  constructor(message: string, public readonly attempts: string[]) {
    super(message);
    this.name = "LLMGenerationError";
  }
}

export interface GenerateOptions<T> {
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  temperature?: number;
  maxTokens?: number;
  /** Total wall-clock budget for this call across ALL providers/models. */
  deadlineMs?: number;
  /** Reasoning effort for models that support it. Default "low". */
  reasoningEffort?: "low" | "medium" | "high";
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

class ProviderCallError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly retryAfterMs?: number,
    public readonly timedOut = false,
    public readonly body = ""
  ) {
    super(message);
  }
}

// ---- circuit breaker (per warm instance) ----------------------------------

const cooldowns = new Map<string, number>();
const minimalOnly = new Set<string>(); // models that rejected optional params

function isCooling(key: string): boolean {
  const until = cooldowns.get(key);
  if (!until) return false;
  if (until <= Date.now()) {
    cooldowns.delete(key);
    return false;
  }
  return true;
}

function coolDown(key: string, ms: number) {
  cooldowns.set(key, Date.now() + ms);
}

function applyCooldown(provider: ProviderConfig, model: string, err: ProviderCallError) {
  const modelKey = `${provider.name}/${model}`;
  const s = err.status;
  if (s === 401 || s === 403) return coolDown(provider.name, 10 * 60_000);
  if (s === 404 || (s === 400 && /model|decommission|deprecat|not found|does not exist/i.test(err.body)))
    return coolDown(modelKey, 30 * 60_000);
  if (s === 429) return coolDown(modelKey, Math.min(err.retryAfterMs ?? 60_000, 5 * 60_000));
  if (s && s >= 500) return coolDown(modelKey, 60_000);
  if (err.timedOut) return coolDown(modelKey, 120_000);
  coolDown(modelKey, 60_000);
}

// ---- provider call ---------------------------------------------------------

function resolveModels(provider: ProviderConfig): string[] {
  const override = process.env[provider.modelEnvKey];
  if (!override) return provider.models;
  const overridden = override.split(",").map((s) => s.trim()).filter(Boolean);
  return [...overridden, ...provider.models.filter((m) => !overridden.includes(m))];
}

function optionalParams(
  provider: ProviderConfig,
  model: string,
  effort: "low" | "medium" | "high"
): Record<string, unknown> {
  const params: Record<string, unknown> = { response_format: { type: "json_object" } };
  if ((provider.name === "groq" || provider.name === "cerebras") && /gpt-oss/i.test(model)) {
    params.reasoning_effort = effort;
  } else if (provider.name === "openrouter") {
    params.reasoning = { effort };
  }
  return params;
}

async function callProvider(args: {
  provider: ProviderConfig;
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  minimal: boolean;
  effort: "low" | "medium" | "high";
}): Promise<string> {
  const { provider, model } = args;
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: args.systemPrompt },
      { role: "user", content: args.userPrompt },
    ],
    temperature: args.temperature,
    max_tokens: args.maxTokens,
  };
  if (!args.minimal) Object.assign(body, optionalParams(provider, model, args.effort));

  let res: Response;
  try {
    res = await fetch(provider.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${args.apiKey}`,
        ...provider.extraHeaders,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(args.timeoutMs),
    });
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    throw new ProviderCallError(
      `${provider.name}/${model} ${timedOut ? `timed out after ${args.timeoutMs}ms` : `network error: ${String(err)}`}`,
      undefined,
      undefined,
      timedOut
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const ra = Number(res.headers.get("retry-after"));
    throw new ProviderCallError(
      `${provider.name}/${model} responded ${res.status}: ${text.slice(0, 300)}`,
      res.status,
      Number.isFinite(ra) && ra > 0 ? ra * 1000 : undefined,
      false,
      text.slice(0, 500)
    );
  }

  let data: ChatCompletionResponse;
  try {
    data = (await res.json()) as ChatCompletionResponse;
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    throw new ProviderCallError(`${provider.name}/${model} bad response body`, undefined, undefined, timedOut);
  }
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new ProviderCallError(`${provider.name}/${model} returned no content`);
  return content;
}

function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const trimmed = (fenced ? fenced[1] : raw).trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.search(/[{[]/);
    const end = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
    if (start === -1 || end === -1 || end < start) throw new Error("No JSON object found in model output");
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * generate(prompt, schema) → structured, Zod-validated result. Same signature
 * as before; existing callers need no changes.
 */
export async function generate<T>(opts: GenerateOptions<T>): Promise<T> {
  const started = Date.now();
  const budget = opts.deadlineMs ?? DEFAULT_DEADLINE_MS;
  const remaining = () => budget - (Date.now() - started);
  const temperature = opts.temperature ?? 0.2;
  const maxTokens = opts.maxTokens ?? 3000;
  const effort = opts.reasoningEffort ?? "low";
  const attempts: string[] = [];
  const providers = orderedProviders().filter((p) => !!process.env[p.envKey]);

  // Pass 0 respects cooldowns. If NOTHING could be attempted (everything is
  // cooling down — e.g. only one provider key is set and it just rate-limited),
  // pass 1 ignores cooldowns rather than failing instantly.
  for (let pass = 0; pass < 2; pass++) {
    const ignoreCooldowns = pass === 1;
    let attemptsMade = 0;

    for (const provider of providers) {
      const apiKey = process.env[provider.envKey]!;
      if (!ignoreCooldowns && isCooling(provider.name)) {
        attempts.push(`${provider.name}: skipped (cooling down)`);
        continue;
      }

      for (const model of resolveModels(provider)) {
        const key = `${provider.name}/${model}`;
        if (!ignoreCooldowns && isCooling(key)) continue;

        let lastIssue = "";
        for (let attempt = 1; attempt <= 2; attempt++) {
          const timeoutMs = Math.min(provider.timeoutMs, remaining() - 1_000);
          if (timeoutMs < MIN_ATTEMPT_MS) {
            attempts.push(`deadline reached after ${Date.now() - started}ms`);
            throw new LLMGenerationError(
              "LLM call ran out of time budget before any provider returned a valid response.",
              attempts
            );
          }
          if (attempt === 2 && remaining() < MIN_RETRY_BUDGET_MS) break;

          const userPrompt =
            attempt === 1
              ? opts.userPrompt
              : `${opts.userPrompt}\n\nYour previous reply was rejected (${lastIssue}). Reply again with ONLY the corrected JSON object.`;

          attemptsMade++;
          const t0 = Date.now();
          try {
            const call = (minimal: boolean) =>
              callProvider({
                provider,
                apiKey,
                model,
                systemPrompt: opts.systemPrompt,
                userPrompt,
                temperature,
                maxTokens,
                timeoutMs,
                minimal,
                effort,
              });

            let raw: string;
            if (minimalOnly.has(key)) {
              raw = await call(true);
            } else {
              try {
                raw = await call(false);
              } catch (e) {
                // Provider rejected optional params — retry bare, remember it.
                if (e instanceof ProviderCallError && e.status === 400 && remaining() > MIN_ATTEMPT_MS + 1_000) {
                  raw = await call(true);
                  minimalOnly.add(key);
                } else {
                  throw e;
                }
              }
            }

            const parsed = opts.schema.safeParse(extractJson(raw));
            if (parsed.success) {
              console.log(`[llm] ${key} ok in ${Date.now() - t0}ms (total ${Date.now() - started}ms)`);
              return parsed.data;
            }
            lastIssue = parsed.error.issues[0]?.message ?? "invalid shape";
            attempts.push(`${key} attempt ${attempt}: schema validation failed — ${lastIssue}`);
            continue; // one corrective retry on the same model
          } catch (err) {
            attempts.push(`${key} attempt ${attempt}: ${err instanceof Error ? err.message : String(err)}`);
            if (err instanceof ProviderCallError) {
              // Short rate-limit: wait once and retry the same model.
              if (
                err.status === 429 &&
                attempt === 1 &&
                err.retryAfterMs !== undefined &&
                err.retryAfterMs <= 4_000 &&
                remaining() > err.retryAfterMs + MIN_RETRY_BUDGET_MS
              ) {
                await sleep(err.retryAfterMs);
                continue;
              }
              applyCooldown(provider, model, err);
            } else if (err instanceof Error && /JSON/i.test(err.message)) {
              lastIssue = "not valid JSON";
              if (attempt === 1) continue;
              break;
            }
            break; // hard failure — next model
          }
        }
      }
    }

    if (attemptsMade > 0) break;
  }

  throw new LLMGenerationError(
    attempts.length === 0
      ? "No LLM provider is configured. Set at least one of GROQ_API_KEY, CEREBRAS_API_KEY, OPENROUTER_API_KEY, NVIDIA_API_KEY, or HF_API_KEY."
      : "All configured LLM providers and their fallback models failed to produce a valid response.",
    attempts
  );
}
