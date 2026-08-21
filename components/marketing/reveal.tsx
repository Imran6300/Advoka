'use client'

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type RevealVariant = 'up' | 'up-sm' | 'scale' | 'left' | 'right' | 'fade'

interface RevealProps {
  children?: ReactNode
  className?: string
  /** delay in ms */
  delay?: number
  as?: ElementType
  once?: boolean
  /** entrance vocabulary — pick one that matches what the content is doing, not the default everywhere */
  variant?: RevealVariant
  /** threshold override for early/late triggers (e.g. tall panels) */
  threshold?: number
}

export function Reveal({
  children,
  className,
  delay = 0,
  as,
  once = true,
  variant = 'up',
  threshold = 0.15,
}: RevealProps) {
  const Comp = (as ?? 'div') as ElementType
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            if (once) observer.unobserve(entry.target)
          } else if (!once) {
            setVisible(false)
          }
        })
      },
      { threshold, rootMargin: '0px 0px -60px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [once, threshold])

  return (
    <Comp
      ref={ref}
      data-variant={variant === 'up' ? undefined : variant}
      className={cn('reveal', visible && 'is-visible', className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </Comp>
  )
}
