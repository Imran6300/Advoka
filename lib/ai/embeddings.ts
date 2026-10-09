import os from "os";
import path from "path";
import type { FeatureExtractionPipeline } from "@xenova/transformers";

/**
 * Embeddings, two backends producing the SAME 384-dim all-MiniLM-L6-v2 space
 * (so existing vectors and the Atlas vector index stay valid):
 *
 *  - "hf"    (EMBEDDINGS_PROVIDER=hf + HF_API_KEY): hosted on Hugging Face's
 *            router. No model download, no ONNX cold start, no CPU inference
 *            inside a 60s serverless function. Batches run in parallel.
 *  - "local" (default): in-process @xenova/transformers, as before — but with
 *            a writable cache dir so serverless instances can reuse the model.
 *
 * If the hosted call fails, it falls back to local unless EMBEDDINGS_STRICT=1.
 */

const LOCAL_MODEL_ID = "Xenova/all-MiniLM-L6-v2";
const HF_MODEL = process.env.HF_EMBEDDING_MODEL || "sentence-transformers/all-MiniLM-L6-v2";
const HF_URL =
  process.env.HF_EMBEDDING_URL ||
  `https://router.huggingface.co/hf-inference/models/${HF_MODEL}/pipeline/feature-extraction`;
const EMBEDDING_DIM = 384;

const HF_BATCH = 16;
const HF_PARALLEL = 4;
const HF_TIMEOUT_MS = 25_000;
const HF_ATTEMPTS = 3;

function useHosted(): boolean {
  return process.env.EMBEDDINGS_PROVIDER?.toLowerCase() === "hf" && !!process.env.HF_API_KEY;
}

/** How many chunks one Inngest step should embed, so a step stays well under the function time limit. */
export function embeddingStepSize(): number {
  return useHosted() ? 64 : 24;
}

// ---- shared helpers -------------------------------------------------------

function l2normalize(v: number[]): number[] {
  let sum = 0;
  for (const x of v) sum += x * x;
  const norm = Math.sqrt(sum) || 1;
  return v.map((x) => x / norm);
}

function toVector(item: unknown): number[] {
  if (Array.isArray(item) && typeof item[0] === "number") return item as number[];
  // Token-level output (number[][]) — mean-pool.
  if (Array.isArray(item) && Array.isArray(item[0])) {
    const tokens = item as number[][];
    const dim = tokens[0].length;
    const out = new Array<number>(dim).fill(0);
    for (const t of tokens) for (let i = 0; i < dim; i++) out[i] += t[i];
    return out.map((x) => x / tokens.length);
  }
  throw new Error("Unexpected embedding response shape");
}

// ---- hosted (Hugging Face) -------------------------------------------------

let hfBareOnly = false; // set if the endpoint rejects truncate/normalize params
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function hfEmbedBatch(batch: string[]): Promise<number[][]> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= HF_ATTEMPTS; attempt++) {
    try {
      const body = hfBareOnly
        ? { inputs: batch }
        : { inputs: batch, normalize: true, truncate: true };
      const res = await fetch(HF_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(HF_TIMEOUT_MS),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        if ((res.status === 400 || res.status === 422) && !hfBareOnly) {
          hfBareOnly = true; // retry immediately without optional params
          continue;
        }
        const retryable = res.status === 429 || res.status === 503 || res.status >= 500;
        const err = new Error(`HF embeddings ${res.status}: ${text.slice(0, 200)}`);
        if (!retryable) throw Object.assign(err, { fatal: true });
        const ra = Number(res.headers.get("retry-after"));
        await sleep(Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, 8_000) : 1_000 * attempt);
        lastErr = err;
        continue;
      }

      const json = (await res.json()) as unknown;
      if (!Array.isArray(json) || json.length !== batch.length) {
        throw Object.assign(new Error("HF embeddings returned unexpected batch size"), { fatal: true });
      }
      return json.map((item) => {
        const vec = l2normalize(toVector(item));
        if (vec.length !== EMBEDDING_DIM) {
          throw Object.assign(new Error(`HF embeddings returned ${vec.length}-dim vector, expected ${EMBEDDING_DIM}`), {
            fatal: true,
          });
        }
        return vec;
      });
    } catch (err) {
      if ((err as { fatal?: boolean }).fatal) throw err;
      lastErr = err;
      await sleep(500 * attempt);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("HF embeddings failed");
}

async function embedHosted(texts: string[]): Promise<number[][]> {
  const batches: string[][] = [];
  for (let i = 0; i < texts.length; i += HF_BATCH) batches.push(texts.slice(i, i + HF_BATCH));

  const results: number[][][] = new Array(batches.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(HF_PARALLEL, batches.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= batches.length) return;
      results[i] = await hfEmbedBatch(batches[i]);
    }
  });
  await Promise.all(workers);
  return results.flat();
}

// ---- local (@xenova/transformers) -----------------------------------------

declare global {
  // eslint-disable-next-line no-var
  var _embeddingPipeline: Promise<FeatureExtractionPipeline> | undefined;
}

async function getPipeline(): Promise<FeatureExtractionPipeline> {
  if (!global._embeddingPipeline) {
    global._embeddingPipeline = (async () => {
      const { pipeline, env } = await import("@xenova/transformers");
      // Serverless file systems are read-only except the tmp dir; without this
      // the model can't be cached and is re-downloaded on every cold start.
      env.cacheDir = process.env.TRANSFORMERS_CACHE_DIR || path.join(os.tmpdir(), "transformers-cache");
      env.allowLocalModels = false;
      return pipeline("feature-extraction", LOCAL_MODEL_ID, { quantized: true });
    })().catch((err) => {
      global._embeddingPipeline = undefined; // don't cache a failed load
      throw err;
    });
  }
  return global._embeddingPipeline;
}

async function embedLocal(texts: string[]): Promise<number[][]> {
  const extractor = await getPipeline();
  const BATCH_SIZE = 16;
  const results: number[][] = [];
  for (let start = 0; start < texts.length; start += BATCH_SIZE) {
    const batch = texts.slice(start, start + BATCH_SIZE);
    const output = await extractor(batch, { pooling: "mean", normalize: true });
    const dims = output.dims as number[];
    const dim = dims[dims.length - 1];
    const flat = output.data as Float32Array;
    for (let i = 0; i < batch.length; i++) {
      results.push(Array.from(flat.subarray(i * dim, (i + 1) * dim)));
    }
  }
  return results;
}

// ---- public API (unchanged signatures) ------------------------------------

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (useHosted()) {
    try {
      return await embedHosted(texts);
    } catch (err) {
      console.error("[embeddings] hosted embedding failed", err);
      if (process.env.EMBEDDINGS_STRICT === "1") throw err;
      console.warn("[embeddings] falling back to local model");
    }
  }
  return embedLocal(texts);
}

/** Embeds a single string into a 384-dim, L2-normalized vector. */
export async function embedText(text: string): Promise<number[]> {
  return (await embedTexts([text]))[0];
}
