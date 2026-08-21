import { Layers, GitCompareArrows, Puzzle } from 'lucide-react'
import { SectionHeading } from '@/components/marketing/section-heading'
import { Reveal } from '@/components/marketing/reveal'

const CARDS = [
  {
    icon: Layers,
    title: 'Too much information',
    body: 'Important facts are scattered across documents.',
  },
  {
    icon: GitCompareArrows,
    title: 'Conflicting evidence',
    body: 'Different statements can tell very different stories.',
  },
  {
    icon: Puzzle,
    title: 'Missing pieces',
    body: 'Referenced evidence may not always be available for review.',
  },
]

export function ProblemSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
      <SectionHeading
        eyebrow="The challenge"
        title="Legal cases are buried in information."
        description="Contracts, witness statements, invoices, correspondence and other documents can make it difficult to see the full picture of a case."
      />

      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {CARDS.map(({ icon: Icon, title, body }, i) => (
          <Reveal key={title} delay={i * 110} variant="up-sm">
            <article className="card-interactive group h-full rounded-xl border border-border bg-surface/60 p-6 hover:border-primary/30 hover:bg-elevated/70">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-elevated text-accent-ai transition-colors duration-300 group-hover:border-primary/40">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{body}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
