import { FolderPlus, Upload, ScanSearch, Compass, FileText, Sparkles, CheckCircle2 } from 'lucide-react'
import { SectionHeading } from '@/components/marketing/section-heading'
import { Reveal } from '@/components/marketing/reveal'

const STEPS = [
  {
    n: '01',
    title: 'Create a case',
    body: 'Set up a workspace for the matter you are working on.',
    icon: FolderPlus,
    visual: <CaseVisual />,
  },
  {
    n: '02',
    title: 'Upload documents',
    body: 'Add contracts, statements, invoices and correspondence.',
    icon: Upload,
    visual: <UploadVisual />,
  },
  {
    n: '03',
    title: 'Analyze the evidence',
    body: 'Advoka structures the facts, contradictions and timeline.',
    icon: ScanSearch,
    visual: <AnalyzeVisual />,
  },
  {
    n: '04',
    title: 'Investigate, verify and draft',
    body: 'Ask questions, trace sources and create reviewed drafts.',
    icon: Compass,
    visual: <ActVisual />,
  },
]

function CaseVisual() {
  return (
    <div className="rounded-lg border border-border bg-surface/70 p-3">
      <p className="text-[12px] font-medium text-foreground">Meridian v. Cascade</p>
      <p className="mt-1 text-[11px] text-muted-foreground">Commercial dispute</p>
    </div>
  )
}
function UploadVisual() {
  return (
    <div className="space-y-1.5">
      {['Agreement.pdf', 'Statement.pdf', 'Invoice.pdf'].map((f) => (
        <div key={f} className="flex items-center gap-2 rounded-md border border-border bg-surface/70 px-2.5 py-1.5">
          <FileText className="h-3.5 w-3.5 text-accent-ai" />
          <span className="text-[11px] text-secondary-foreground">{f}</span>
          <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-success" />
        </div>
      ))}
    </div>
  )
}
function AnalyzeVisual() {
  return (
    <div className="rounded-lg border border-primary/25 bg-primary/[0.06] p-3">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-accent-ai" />
        <span className="text-[11px] font-medium text-accent-ai">Analyzing evidence</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
        <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-primary to-accent-ai" />
      </div>
    </div>
  )
}
function ActVisual() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {['Ask', 'Verify', 'Draft'].map((t) => (
        <span key={t} className="rounded-md border border-border bg-surface/70 px-2 py-1 text-[11px] text-secondary-foreground">
          {t}
        </span>
      ))}
    </div>
  )
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
      <SectionHeading
        eyebrow="How it works"
        title="From documents to decisions."
        description="A simple, predictable flow — from setting up a case to investigating it with confidence."
      />

      <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ n, title, body, icon: Icon, visual }, i) => (
          <Reveal key={n} delay={i * 100} variant="up-sm">
            <article className="card-interactive flex h-full flex-col rounded-xl border border-border bg-surface/60 p-5 hover:border-primary/25">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-elevated text-accent-ai">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-xs text-muted-foreground">{n}</span>
              </div>
              <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
              <div className="mt-4 border-t border-border pt-4">{visual}</div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
