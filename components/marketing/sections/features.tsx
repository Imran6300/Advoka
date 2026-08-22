import { SectionHeading } from '@/components/marketing/section-heading'
import { FeatureShowcase, VisualFrame } from '@/components/marketing/sections/feature-showcase'
import { SummaryDemo, ContradictionDemo, MissingEvidenceDemo } from '@/components/marketing/product/demos'
import { TimelinePanel, GraphViz, ChatPanel, DraftsPanel } from '@/components/marketing/product/panels'

export function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl overflow-x-hidden px-5 py-24 sm:px-8 sm:py-28">
      <SectionHeading
        eyebrow="Features"
        title="Everything you need to investigate a case."
        description="Advoka structures the evidence so you can move from documents to understanding, and from understanding to action."
      />

      <div className="mt-20 space-y-24 sm:space-y-28">
        <FeatureShowcase
          feature="AI Case Summary"
          title="See the case at a glance."
          description="Get a structured overview of the case without reading every document from beginning to end."
          visualVariant="scale"
        >
          <SummaryDemo />
        </FeatureShowcase>

        <FeatureShowcase
          reverse
          feature="Contradiction Detection"
          title="Find where the evidence disagrees."
          description="Advoka can surface conflicting statements so lawyers know what deserves closer review."
          visualVariant="fade"
        >
          <ContradictionDemo />
        </FeatureShowcase>

        <FeatureShowcase
          feature="Missing Information"
          title="Know what evidence is still missing."
          description="Advoka links gaps in the evidence to the case facts that depend on them, so nothing important slips through."
          visualVariant="fade"
        >
          <MissingEvidenceDemo />
        </FeatureShowcase>

        <FeatureShowcase
          reverse
          feature="Timeline"
          title="See how the case unfolds."
          description="Every dated event, organized into a single chronological view that makes the sequence of the case clear."
          visualVariant="fade"
        >
          <VisualFrame>
            <TimelinePanel />
          </VisualFrame>
        </FeatureShowcase>

        <FeatureShowcase
          feature="Evidence Graph"
          title="See how the evidence connects."
          description="Understand the relationships between people, documents and evidence, including where contradictions and gaps appear."
          visualVariant="fade"
        >
          <VisualFrame className="p-5">
            <GraphViz />
          </VisualFrame>
        </FeatureShowcase>

        <FeatureShowcase
          reverse
          feature="Ask Advoka"
          title="Ask Advoka about the case."
          description="Ask questions in plain language and get answers grounded in the documents you uploaded, with references you can open."
          visualVariant="fade"
        >
          <VisualFrame>
            <ChatPanel />
          </VisualFrame>
        </FeatureShowcase>

        <FeatureShowcase
          feature="AI Drafting"
          title="Turn case intelligence into action."
          description="Create useful first drafts — from legal notices to client emails — grounded in the case, and always ready for your review."
          note="Advoka drafts are a starting point, not final advice — every draft is marked for review."
          visualVariant="fade"
        >
          <VisualFrame>
            <DraftsPanel />
          </VisualFrame>
        </FeatureShowcase>
      </div>
    </section>
  )
}
