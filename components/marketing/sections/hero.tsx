'use client'

import { ArrowRight, FileSearch, GitBranch, Play, ShieldCheck } from 'lucide-react'
import { CtaButton } from '@/components/marketing/cta-button'
import { Reveal } from '@/components/marketing/reveal'
import { AppWindow } from '@/components/marketing/product/app-window'
import { OverviewPanel } from '@/components/marketing/product/panels'
import { useTilt } from '@/components/marketing/use-tilt'
import { HeroBackground } from '@/components/marketing/sections/hero-background'

const TRUST_POINTS = [
  { icon: FileSearch, label: 'Document intelligence' },
  { icon: GitBranch, label: 'Case relationship graphs' },
  { icon: ShieldCheck, label: 'Built for confidential case data' },
]

export function Hero() {
  const tiltRef = useTilt<HTMLDivElement>(2.5)

  return (
    <section id="top" className="relative isolate overflow-hidden pt-28 sm:pt-36">
      <HeroBackground />

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-elevated/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-secondary-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="dot-pulse absolute inline-flex h-full w-full rounded-full bg-accent-ai" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-ai" />
              </span>
              AI Case Intelligence for Lawyers
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-[3.75rem]">
              Understand Every Case.
              <br />
              <span className="bg-gradient-to-r from-primary via-accent-ai to-foreground bg-clip-text text-transparent">
                Work Smarter.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Advoka turns complex case documents into structured case intelligence, helping lawyers find the facts,
              contradictions, missing evidence and deadlines that matter.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <CtaButton href="/sign-up" variant="primary">
                Get started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </CtaButton>
              <CtaButton href="#how-it-works" variant="secondary">
                <Play className="h-3.5 w-3.5 text-accent-ai" />
                See how it works
              </CtaButton>
            </div>
          </Reveal>

          <Reveal delay={300} variant="fade">
            <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-7 gap-y-3">
              {TRUST_POINTS.map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 text-accent-ai/80" />
                  {label}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Product preview — emerges into view, then settles into a calm, cursor-responsive tilt */}
        <Reveal delay={380} variant="scale" className="relative mt-16 sm:mt-20">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-10 -top-10 bottom-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(91,91,214,0.18),transparent)]"
          />
          <div className="[perspective:2000px]">
            <div
              ref={tiltRef}
              data-tilt
              className="glow-border relative mx-auto max-w-5xl rounded-xl transition-transform duration-300 ease-out will-change-transform [transform:rotateX(calc(3deg+var(--rx,0deg)))_rotateY(var(--ry,0deg))]"
            >
              <div aria-hidden className="absolute inset-0 overflow-hidden rounded-xl">
                <div className="glow-border-spin" />
              </div>
              <div className="relative m-px">
                <AppWindow activeTab="overview">
                  <OverviewPanel />
                </AppWindow>
              </div>
            </div>
          </div>
          {/* fade the bottom into the page */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -bottom-1 h-32 bg-gradient-to-b from-transparent to-background"
          />
        </Reveal>
      </div>
    </section>
  )
}
