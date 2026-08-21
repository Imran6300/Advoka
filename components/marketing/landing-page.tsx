import "./marketing.css";

import { Navbar } from "@/components/marketing/sections/navbar";
import { Hero } from "@/components/marketing/sections/hero";
import { CapabilityStrip } from "@/components/marketing/sections/capability-strip";
import { ProblemSection } from "@/components/marketing/sections/problem-section";
import { Workflow } from "@/components/marketing/sections/workflow";
import { Features } from "@/components/marketing/sections/features";
import { SourceGrounding } from "@/components/marketing/sections/source-grounding";
import { ProductTour } from "@/components/marketing/sections/product-tour";
import { HowItWorks } from "@/components/marketing/sections/how-it-works";
import { SecuritySection } from "@/components/marketing/sections/security-section";
import { FinalCta } from "@/components/marketing/sections/final-cta";
import { Faq } from "@/components/marketing/sections/faq";
import { Footer } from "@/components/marketing/sections/footer";

// The Advoka marketing landing page, ported in as-is from the standalone
// landing project. Design, layout, copy and animations are unchanged —
// only the CTA buttons were rewired to point at /sign-in and /sign-up
// (see cta-button usages in sections/navbar.tsx, hero.tsx, final-cta.tsx)
// so visitors land in the real product instead of a separate site.
export function LandingPage() {
  return (
    <div className="marketing-scope">
      <Navbar />
      <main>
        <Hero />
        <CapabilityStrip />
        <ProblemSection />
        <Workflow />
        <ProductTour />
        <Features />
        <SourceGrounding />
        <HowItWorks />
        <SecuritySection />
        <FinalCta />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
