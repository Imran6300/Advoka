import { Lock, Quote, Activity, UserCheck, ShieldCheck } from 'lucide-react'
import { SectionHeading } from '@/components/marketing/section-heading'
import { Reveal } from '@/components/marketing/reveal'

const PRINCIPLES = [
  {
    icon: Lock,
    title: 'Private document access',
    body: 'Your case documents stay within your case. Advoka works from what you provide.',
  },
  {
    icon: Quote,
    title: 'Source transparency',
    body: 'Insights reference the documents behind them, so you can always check the origin.',
  },
  {
    icon: Activity,
    title: 'Clear processing states',
    body: 'You can see what has been analyzed and what is still being processed.',
  },
  {
    icon: UserCheck,
    title: 'Human review',
    body: 'Advoka is designed to inform the judgment of a lawyer, never to replace it.',
  },
]

export function SecuritySection() {
  return (
    <section id="security" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
      <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="lg:sticky lg:top-28">
          <SectionHeading
            align="left"
            eyebrow="Security & privacy"
            title="Built for sensitive casework."
            description="Legal work demands trust. Advoka is designed around transparency, clear states and human review — with AI output that is always meant to be verified."
          />
          <Reveal delay={160}>
            <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent-ai text-primary-foreground">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Evidence-grounded AI</p>
                <p className="text-[13px] text-muted-foreground">Verifiable, traceable, reviewable</p>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 100} variant="up-sm">
              <article className="card-interactive h-full rounded-xl border border-border bg-surface/60 p-5 hover:border-primary/25">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-elevated text-accent-ai">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
