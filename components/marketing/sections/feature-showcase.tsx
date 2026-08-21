import type { ReactNode } from 'react'
import { Reveal, type RevealVariant } from '@/components/marketing/reveal'
import { cn } from '@/lib/utils'

export function FeatureShowcase({
  feature,
  title,
  description,
  children,
  reverse = false,
  note,
  visualVariant = 'scale',
}: {
  feature: string
  title: string
  description: string
  children: ReactNode
  reverse?: boolean
  note?: string
  /** entrance for the visual column — 'fade' when the demo choreographs its own internal reveal */
  visualVariant?: RevealVariant
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <Reveal className={cn(reverse && 'lg:order-2')}>
        <div className="max-w-md">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-ai">{feature}</span>
          <h3 className="mt-3 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h3>
          <p className="mt-4 text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
          {note ? <p className="mt-4 text-sm text-muted-foreground/80">{note}</p> : null}
        </div>
      </Reveal>

      <Reveal delay={100} variant={visualVariant} className={cn(reverse && 'lg:order-1')}>
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-6 -z-10 bg-[radial-gradient(60%_60%_at_50%_40%,rgba(91,91,214,0.10),transparent)]"
          />
          {children}
        </div>
      </Reveal>
    </div>
  )
}

export function VisualFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-surface shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_30px_80px_-40px_rgba(0,0,0,0.7)]',
        className,
      )}
    >
      {children}
    </div>
  )
}
