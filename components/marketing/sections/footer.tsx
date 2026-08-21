import { AdvokaLogo } from '@/components/marketing/advoka-logo'

const GROUPS = [
  {
    heading: 'Product',
    links: [
      { label: 'Product', href: '#product' },
      { label: 'Features', href: '#features' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Security', href: '#security' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <AdvokaLogo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              AI Case Intelligence for Lawyers. Upload the case. Understand it faster. Work smarter.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:gap-16">
            {GROUPS.map((group) => (
              <nav key={group.heading} aria-label={group.heading}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {group.heading}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        className="text-sm text-secondary-foreground transition-colors duration-200 hover:text-foreground"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-[13px] text-muted-foreground">
            &copy; {new Date().getFullYear()} Advoka. All rights reserved.
          </p>
          <p className="text-[13px] text-muted-foreground">
            Advoka is currently an MVP being validated with lawyers.
          </p>
        </div>
      </div>
    </footer>
  )
}
