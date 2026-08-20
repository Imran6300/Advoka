import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { documentProcessing } from "@/inngest/functions/documentProcessing";
import { caseAnalysis } from "@/inngest/functions/caseAnalysis";
import { graphBuild } from "@/inngest/functions/graphBuild";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [documentProcessing, caseAnalysis, graphBuild],
});
