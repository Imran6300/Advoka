import type { FeatureExtractionPipeline } from "@xenova/transformers";

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

// Cache the pipeline on the global object, same reasoning as the Mongo
// connection cache — serverless invocations and dev hot-reloads should
// reuse one loaded model instead of re-downloading/re-initializing it.
declare global {
  // eslint-disable-next-line no-var
  var _embeddingPipeline: Promise<FeatureExtractionPipeline> | undefined;
}

async function getPipeline(): Promise<FeatureExtractionPipeline> {
  if (!global._embeddingPipeline) {
    global._embeddingPipeline = (async () => {
      const { pipeline } = await import("@xenova/transformers");
      return pipeline("feature-extraction", MODEL_ID, { quantized: true });
    })();
  }
  return global._embeddingPipeline;
}

/** Embeds a single string into a 384-dim, mean-pooled, L2-normalized vector. */
export async function embedText(text: string): Promise<number[]> {
  const extractor = await getPipeline();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

/** Embeds many strings in batched passes instead of one call per string.
 *  Batch size is capped so a large document (100s of chunks) doesn't spike
 *  memory in one huge inference call on a serverless function. */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const extractor = await getPipeline();
  const BATCH_SIZE = 32;
  const results: number[][] = [];

  for (let start = 0; start < texts.length; start += BATCH_SIZE) {
    const batch = texts.slice(start, start + BATCH_SIZE);
    const output = await extractor(batch, { pooling: "mean", normalize: true });
    // Batched output is a stacked tensor: [batch.length, 384]. Split it back
    // into one plain array per input string.
    const dims = output.dims as number[];
    const dim = dims[dims.length - 1];
    const flat = output.data as Float32Array;
    for (let i = 0; i < batch.length; i++) {
      results.push(Array.from(flat.subarray(i * dim, (i + 1) * dim)));
    }
  }

  return results;
}