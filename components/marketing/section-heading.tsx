import type { ReactNode } from 'react'
import { Reveal } from '@/components/marketing/reveal'
import { cn } from '@/lib/utils'

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: 'center' | 'left'
  className?: string
}) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' ? 'mx-auto text-center' : 'text-left',
        className,
      )}
    >
      {eyebrow ? (
        <Reveal>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-ai">{eyebrow}</span>
        </Reveal>
      ) : null}
      <Reveal delay={60}>
        <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-[2.5rem] sm:leading-[1.1]">
          {title}
        </h2>
      </Reveal>
      {description ? (
        <Reveal delay={120}>
          <p
            className={cn(
              'mt-4 text-pretty text-base leading-relaxed text-muted-foreground sm:text-[17px]',
              align === 'center' && 'mx-auto',
            )}
          >
            {description}
          </p>
        </Reveal>
      ) : null}
    </div>
  )
}
