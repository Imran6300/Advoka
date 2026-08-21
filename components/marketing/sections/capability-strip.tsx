import {
  Brain,
  ScanSearch,
  GitCompareArrows,
  FileWarning,
  CalendarClock,
  PenLine,
} from 'lucide-react'
import { Reveal } from '@/components/marketing/reveal'

const CAPABILITIES = [
  { label: 'Case Intelligence', icon: Brain },
  { label: 'Evidence Analysis', icon: ScanSearch },
  { label: 'Contradiction Detection', icon: GitCompareArrows },
  { label: 'Missing Information', icon: FileWarning },
  { label: 'Timeline Analysis', icon: CalendarClock },
  { label: 'AI Drafting', icon: PenLine },
]

export function CapabilityStrip() {
  return (
    <section className="border-y border-border/70 bg-surface/40">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
        <Reveal variant="fade">
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:justify-between sm:gap-x-4">
            {CAPABILITIES.map(({ label, icon: Icon }) => (
              <li key={label} className="group flex items-center gap-2.5 text-muted-foreground">
                <Icon className="h-4 w-4 text-accent-ai/80 transition-transform duration-300 ease-out group-hover:scale-110" />
                <span className="text-sm font-medium tracking-tight text-secondary-foreground transition-colors duration-200 group-hover:text-foreground">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
