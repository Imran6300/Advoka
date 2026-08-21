import { ArrowRight } from 'lucide-react'
import { CtaButton } from '@/components/marketing/cta-button'
import { Reveal } from '@/components/marketing/reveal'

export function FinalCta() {
  return (
    <section id="get-started" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
      <Reveal variant="scale">
        <div className="group relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-16 text-center transition-colors duration-500 hover:border-primary/25 sm:px-16 sm:py-24">
          {/* ambient glow */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="glow-breathe absolute left-1/2 top-0 h-80 w-[640px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(91,91,214,0.22),transparent)] blur-2xl" />
            <div className="absolute inset-0 bg-dots opacity-[0.25] [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)]" />
          </div>

          <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight text-foreground sm:text-[2.75rem] sm:leading-[1.08]">
            Understand your next case faster.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Upload your case documents and see what Advoka can uncover.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CtaButton href="/sign-up" variant="primary">
              Get started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </CtaButton>
            <CtaButton href="#product" variant="secondary">
              See the product
            </CtaButton>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
