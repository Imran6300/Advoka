'use client'

import { Upload, Cpu, Layers3, ShieldCheck, Wand2 } from 'lucide-react'
import { SectionHeading } from '@/components/marketing/section-heading'
import { Reveal } from '@/components/marketing/reveal'

const STEPS = [
  { n: '01', label: 'Upload', icon: Upload, body: 'Upload case documents.' },
  { n: '02', label: 'Analyze', icon: Cpu, body: 'Advoka processes the available information.' },
  { n: '03', label: 'Understand', icon: Layers3, body: 'Surface facts, evidence, contradictions and timelines.' },
  { n: '04', label: 'Verify', icon: ShieldCheck, body: 'Trace important insights back to their sources.' },
  { n: '05', label: 'Act', icon: Wand2, body: 'Ask questions and create drafts.' },
]

export function Workflow() {
  return (
    <section className="border-y border-border/70 bg-surface/30">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
        <SectionHeading
          eyebrow="The solution"
          title="Turn case documents into case intelligence."
          description="Advoka organizes the information that matters so lawyers can investigate a case faster."
        />

        <div className="relative mt-16">
          {/* connection line (desktop) */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px lg:block"
          >
            <div className="mx-auto h-px w-[85%] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          </div>

          <ol className="grid gap-8 lg:grid-cols-5 lg:gap-4">
            {STEPS.map(({ n, label, icon: Icon, body }, i) => (
              <Reveal as="li" key={n} delay={i * 100} variant="up-sm" className="group relative flex gap-4 lg:flex-col lg:gap-0">
                <div className="flex flex-col items-center lg:items-start">
                  <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-elevated text-accent-ai shadow-[0_8px_24px_-12px_rgba(91,91,214,0.5)] transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:border-primary/40">
                    <Icon className="h-6 w-6" />
                  </span>
                </div>
                <div className="lg:mt-5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{n}</span>
                    <h3 className="text-[15px] font-semibold uppercase tracking-wide text-foreground">{label}</h3>
                  </div>
                  <p className="mt-1.5 max-w-[220px] text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
