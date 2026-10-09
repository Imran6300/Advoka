# Speed fix — deploy checklist
1. Supabase → Settings → API → copy the **anon public** key → set `SUPABASE_ANON_KEY` in Vercel (enables direct uploads).
2. Set `EMBEDDINGS_PROVIDER=hf` (needs `HF_API_KEY`) to stop loading the ONNX model inside serverless. Check your HF free quota first.
3. Make sure `GROQ_API_KEY` and/or `CEREBRAS_API_KEY` are set. Order is now groq → cerebras → openrouter → nvidia → hf (override: `LLM_PROVIDER_ORDER`).
4. Redeploy. Upload a doc and open the Inngest dashboard: each step shows its duration. Vercel logs show `[llm]` and `[doc-processing]` timings.
