import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CtaButtonProps extends ComponentProps<typeof Link> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
  children: ReactNode
}

export function CtaButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: CtaButtonProps) {
  return (
    <Link
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-tight',
        'transition-all duration-200 ease-out active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        size === 'sm' ? 'h-9 px-4 text-sm' : 'h-11 px-5 text-[15px]',
        variant === 'primary' &&
          'btn-shine bg-primary text-primary-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset,0_8px_24px_-8px_rgba(91,91,214,0.6)] hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset,0_14px_32px_-10px_rgba(91,91,214,0.7)]',
        variant === 'secondary' &&
          'border border-border bg-elevated/60 text-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:bg-elevated',
        variant === 'ghost' && 'text-secondary-foreground hover:text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  )
}
