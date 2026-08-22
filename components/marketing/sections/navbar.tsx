'use client'

import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { AdvokaLogo } from '@/components/marketing/advoka-logo'
import { CtaButton } from '@/components/marketing/cta-button'
import { cn } from '@/lib/utils'

const LINKS = [
  { label: 'Product', href: '/#product' },
  { label: 'Features', href: '/#features' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Security', href: '/#security' },
  { label: 'FAQ', href: '/#faq' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12)
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-border/80 bg-background/70 shadow-[0_1px_0_0_rgba(255,255,255,0.03)] backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:px-8">
        <a href="/#top" className="group shrink-0" aria-label="Advoka home">
          <span className="inline-block transition-transform duration-300 ease-out group-hover:scale-[1.03]">
            <AdvokaLogo />
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group relative rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              {l.label}
              <span className="pointer-events-none absolute inset-x-3 -bottom-px h-px scale-x-0 bg-accent-ai/70 transition-transform duration-300 ease-out group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <CtaButton href="/sign-in" variant="ghost" size="sm">
            Sign in
          </CtaButton>
          <CtaButton href="/sign-up" variant="primary" size="sm">
            Get started
          </CtaButton>
        </div>

        <button
          type="button"
          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Scroll progress — subtle, brand-colored, never dominant */}
      <div aria-hidden className="h-px w-full bg-transparent">
        <div
          className="h-full origin-left bg-gradient-to-r from-primary to-accent-ai transition-transform duration-150 ease-out"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4" aria-label="Mobile">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-[15px] text-secondary-foreground hover:bg-elevated hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <CtaButton href="/sign-in" variant="secondary" size="md" onClick={() => setOpen(false)}>
                Sign in
              </CtaButton>
              <CtaButton href="/sign-up" variant="primary" size="md" onClick={() => setOpen(false)}>
                Get started
              </CtaButton>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
