import {
  Sparkles,
  Users,
  Scale,
  CalendarClock,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  FileWarning,
  FileText,
  Receipt,
  ClipboardList,
} from 'lucide-react'
import { Reveal } from '@/components/marketing/reveal'
import { VisualFrame } from '@/components/marketing/sections/feature-showcase'
import { cn } from '@/lib/utils'

/* ---------- FEATURE 1: AI CASE SUMMARY ---------- */
export function SummaryDemo() {
  const rows = [
    { icon: Users, label: 'Parties', value: 'Meridian Freight · Cascade Retail' },
    { icon: Scale, label: 'Case type', value: 'Commercial dispute' },
    { icon: DollarSign, label: 'Financial claim', value: '$248,000 disputed' },
    { icon: CalendarClock, label: 'Deadline', value: 'Sep 15, 2026 — Response due' },
  ]
  return (
    <VisualFrame className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent-ai" />
        <span className="text-sm font-medium text-foreground">AI case summary</span>
        <span className="ml-auto rounded-md border border-border bg-elevated px-2 py-0.5 text-[11px] text-muted-foreground">
          Structured overview
        </span>
      </div>
      <p className="rounded-lg border border-primary/25 bg-primary/[0.06] p-3.5 text-[13px] leading-relaxed text-secondary-foreground">
        A commercial dispute concerning a delayed freight shipment. Key issues involve the delivery date, the number of
        units received and a contested invoice.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {rows.map(({ icon: Icon, label, value }, i) => (
          <Reveal
            key={label}
            variant="up-sm"
            delay={i * 90}
            className="rounded-lg border border-border bg-elevated/50 p-3 transition-colors duration-200 hover:border-primary/25"
          >
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Icon className="h-3.5 w-3.5 text-accent-ai" />
              <span className="text-[11px] uppercase tracking-wide">{label}</span>
            </div>
            <p className="mt-1 text-[13px] font-medium text-foreground">{value}</p>
          </Reveal>
        ))}
      </div>
      <div className="mt-4">
        <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">Important events</p>
        <div className="flex flex-wrap gap-1.5">
          {['Agreement executed', 'Invoice issued', 'Claimed delivery', 'Demand letter'].map((e) => (
            <span key={e} className="rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-secondary-foreground">
              {e}
            </span>
          ))}
        </div>
      </div>
    </VisualFrame>
  )
}

/* ---------- FEATURE 2: CONTRADICTION DETECTION ---------- */
export function ContradictionDemo() {
  return (
    <VisualFrame className="p-5">
      <Reveal variant="up-sm" className="mb-4 flex items-center justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-error/30 bg-error/[0.08] px-3 py-1 text-[12px] font-medium text-error">
          <AlertTriangle className="h-3.5 w-3.5" /> Potential contradiction
        </span>
      </Reveal>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <Reveal variant="left" delay={80} className="rounded-lg border border-border bg-elevated/60 p-4 transition-colors duration-200 hover:border-error/25">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Source A</p>
          <p className="text-[13px] font-medium text-foreground">Shipment arrived March 10, 2026</p>
          <p className="mt-1 text-[13px] text-secondary-foreground">4,350 units counted</p>
        </Reveal>

        <Reveal variant="scale" delay={260} className="flex items-center justify-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-error/40 bg-error/10 text-error">
            <ArrowRight className="h-4 w-4 rotate-90 sm:rotate-0" />
          </span>
        </Reveal>

        <Reveal variant="right" delay={80} className="rounded-lg border border-border bg-elevated/60 p-4 transition-colors duration-200 hover:border-error/25">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Source B</p>
          <p className="text-[13px] font-medium text-foreground">Shipment delivered March 3, 2026</p>
          <p className="mt-1 text-[13px] text-secondary-foreground">4,800 units delivered</p>
        </Reveal>
      </div>

      <Reveal
        variant="up-sm"
        delay={420}
        className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-error/25 bg-error/[0.05] px-3 py-2.5"
      >
        <span className="text-[12px] font-medium text-error">Review required</span>
        <span className="text-[12px] text-muted-foreground">— conflict on delivery date and quantity</span>
      </Reveal>
    </VisualFrame>
  )
}

/* ---------- FEATURE 3: MISSING INFORMATION ---------- */
export function MissingEvidenceDemo() {
  const items = [
    { icon: ClipboardList, label: 'Shipment Quantity Records', fact: 'Supports disputed unit count' },
    { icon: Receipt, label: 'Invoice Payment Receipt', fact: 'Supports payment claim' },
    { icon: FileText, label: 'Signed Bill of Lading', fact: 'Supports delivery date' },
  ]
  return (
    <VisualFrame className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <FileWarning className="h-4 w-4 text-warning" />
        <span className="text-sm font-medium text-foreground">Missing information</span>
        <span className="ml-auto text-[11px] text-muted-foreground">3 items</span>
      </div>
      <div className="space-y-2.5">
        {items.map(({ icon: Icon, label, fact }, i) => (
          <Reveal
            key={label}
            variant="up-sm"
            delay={i * 140}
            className="rounded-lg border border-border bg-elevated/50 p-3.5 transition-colors duration-200 hover:border-warning/25"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-warning/30 bg-warning/[0.08] text-warning">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-foreground">{label}</p>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                  {fact}
                </div>
              </div>
              <span className="ml-auto shrink-0 rounded-md border border-warning/30 bg-warning/[0.08] px-2 py-0.5 text-[11px] font-medium text-warning">
                Action needed
              </span>
            </div>
          </Reveal>
        ))}
      </div>
    </VisualFrame>
  )
}

/* small helper reused elsewhere */
export function StatusDot({ tone }: { tone: 'error' | 'warning' | 'success' | 'ai' }) {
  return (
    <span
      className={cn(
        'h-2 w-2 rounded-full',
        tone === 'error' && 'bg-error',
        tone === 'warning' && 'bg-warning',
        tone === 'success' && 'bg-success',
        tone === 'ai' && 'bg-accent-ai',
      )}
    />
  )
}
