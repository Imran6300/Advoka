import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { documentProcessing } from "@/inngest/functions/documentProcessing";
import { caseAnalysis } from "@/inngest/functions/caseAnalysis";
import { graphBuild } from "@/inngest/functions/graphBuild";
import { draftGeneration } from "@/inngest/functions/draftGeneration";

// Default Vercel function duration (10s on Hobby, 15s on Pro unless raised)
// is shorter than a cold @xenova/transformers model load + inference pass.
// Without this, Vercel kills the function mid-step and Inngest retries the
// whole step from scratch — which is what makes uploads look stuck.
// 60 is the Hobby-plan ceiling; raise to 300 if you're on Pro.
export const maxDuration = 60;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [documentProcessing, caseAnalysis, graphBuild, draftGeneration],
});
