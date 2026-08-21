import { Sparkles, Quote, FileText, Hash, ScrollText, ChevronRight, AlertTriangle } from 'lucide-react'
import { SectionHeading } from '@/components/marketing/section-heading'
import { Reveal } from '@/components/marketing/reveal'
import { VisualFrame } from '@/components/marketing/sections/feature-showcase'

const CHAIN = [
  { label: 'AI insight', icon: Sparkles },
  { label: 'Source', icon: Quote },
  { label: 'Document', icon: FileText },
  { label: 'Page', icon: Hash },
  { label: 'Original evidence', icon: ScrollText },
]

export function SourceGrounding() {
  return (
    <section className="border-y border-border/70 bg-surface/30">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
        <SectionHeading
          eyebrow="Source grounding"
          title="AI you can verify."
          description="Important insights should always lead back to the evidence behind them."
        />

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Chain */}
          <Reveal variant="left">
            <ol className="flex flex-col gap-2">
              {CHAIN.map(({ label, icon: Icon }, i) => (
                <Reveal as="li" key={label} variant="up-sm" delay={i * 80}>
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-elevated/50 px-4 py-3 transition-colors duration-200 hover:border-primary/25">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/[0.07] text-accent-ai">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-[13px] font-medium uppercase tracking-wide text-foreground">{label}</span>
                    <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  {i < CHAIN.length - 1 && (
                    <div aria-hidden className="ml-[35px] h-4 w-px bg-gradient-to-b from-primary/40 to-primary/10" />
                  )}
                </Reveal>
              ))}
            </ol>
          </Reveal>

          {/* Citation interface */}
          <Reveal delay={120} variant="right">
            <VisualFrame className="p-5">
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-error/30 bg-error/[0.08] px-3 py-1 text-[12px] font-medium text-error">
                <AlertTriangle className="h-3.5 w-3.5" /> Potential contradiction
              </div>

              <div className="space-y-2.5">
                {[
                  { tag: 'Source A', doc: 'Witness Statement', page: 'p.1' },
                  { tag: 'Source B', doc: 'Witness Statement', page: 'p.1' },
                ].map((s, i) => (
                  <Reveal
                    key={s.tag}
                    variant="up-sm"
                    delay={i * 120}
                    className="group flex items-center gap-3 rounded-lg border border-border bg-elevated/50 p-3.5 transition-colors hover:border-primary/30"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-accent-ai">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.tag}</p>
                      <p className="text-[13px] font-medium text-foreground">{s.doc}</p>
                    </div>
                    <span className="ml-auto flex items-center gap-1 text-[12px] text-muted-foreground">
                      {s.page}
                      <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Reveal>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                {['Transparency', 'Traceability', 'Human review'].map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] text-secondary-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </VisualFrame>
          </Reveal>
        </div>

        <Reveal delay={200} variant="fade">
          <p className="mx-auto mt-12 max-w-xl text-center text-sm leading-relaxed text-muted-foreground">
            Advoka is built to support the work of lawyers, not replace it. Insights are grounded in the documents you
            provide and always meant to be reviewed.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
