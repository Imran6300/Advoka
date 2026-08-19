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

/** Embeds many strings sequentially — kept simple and memory-predictable for an MVP. */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const extractor = await getPipeline();
  const results: number[][] = [];
  for (const text of texts) {
    const output = await extractor(text, { pooling: "mean", normalize: true });
    results.push(Array.from(output.data as Float32Array));
  }
  return results;
}
