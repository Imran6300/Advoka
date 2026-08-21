import {
  Sparkles,
  AlertTriangle,
  FileWarning,
  CheckCircle2,
  CalendarClock,
  FileText,
  Users,
  DollarSign,
  Send,
  Quote,
} from 'lucide-react'
import { Reveal } from '@/components/marketing/reveal'
import { cn } from '@/lib/utils'

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-4 sm:p-5', className)}>{children}</div>
}

function PanelHeader({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h4 className="text-sm font-semibold tracking-tight text-foreground">{title}</h4>
      {meta ? <span className="text-[11px] text-muted-foreground">{meta}</span> : null}
    </div>
  )
}

function Card({
  children,
  className,
  tone = 'default',
  interactive = false,
}: {
  children: React.ReactNode
  className?: string
  tone?: 'default' | 'ai' | 'error' | 'warning' | 'success'
  interactive?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-elevated/60 p-3.5',
        interactive && 'card-interactive',
        tone === 'default' && 'border-border',
        tone === 'ai' && 'border-primary/30 bg-primary/[0.06]',
        tone === 'error' && 'border-error/25 bg-error/[0.05]',
        tone === 'warning' && 'border-warning/25 bg-warning/[0.05]',
        tone === 'success' && 'border-success/25 bg-success/[0.05]',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ---------- OVERVIEW ---------- */
export function OverviewPanel() {
  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] text-muted-foreground">
          Commercial dispute
        </span>
        <span className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] text-muted-foreground">
          14 documents
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-accent-ai/30 bg-accent-ai/10 px-2 py-0.5 text-[11px] font-medium text-accent-ai">
          <Sparkles className="h-3 w-3" /> Analyzed by Advoka
        </span>
      </div>

      {/* AI summary */}
      <Card tone="ai" className="mb-3 ai-pulse-once">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-ai" />
          <span className="text-[13px] font-medium text-foreground">AI case summary</span>
        </div>
        <p className="text-[13px] leading-relaxed text-secondary-foreground">
          A commercial dispute over a delayed freight shipment. The parties disagree on the delivery date and the
          quantity of units received, with a contested invoice and an approaching response deadline.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {/* Contradictions */}
        <Card tone="error" interactive>
          <div className="mb-1.5 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-error" />
            <span className="text-[12px] font-medium text-foreground">Contradictions</span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-foreground">2</p>
          <p className="text-[11px] text-muted-foreground">Delivery date, quantity</p>
        </Card>

        {/* Missing info */}
        <Card tone="warning" interactive>
          <div className="mb-1.5 flex items-center gap-2">
            <FileWarning className="h-3.5 w-3.5 text-warning" />
            <span className="text-[12px] font-medium text-foreground">Missing information</span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-foreground">3</p>
          <p className="text-[11px] text-muted-foreground">Records, receipt, lading</p>
        </Card>
      </div>

      {/* Key facts */}
      <div className="mt-3">
        <PanelHeader title="Key facts" meta="6 identified" />
        <div className="space-y-2">
          {[
            { icon: Users, label: 'Parties', value: 'Meridian Freight · Cascade Retail' },
            { icon: DollarSign, label: 'Financial claim', value: '$248,000 disputed' },
            { icon: CalendarClock, label: 'Contractual deadline', value: 'March 5, 2026' },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-md border border-border bg-surface/60 px-3 py-2 transition-colors duration-200 hover:border-primary/25 hover:bg-elevated/50"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-accent-ai" />
              <span className="text-[12px] text-muted-foreground">{label}</span>
              <span className="ml-auto text-[12px] font-medium text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}

/* ---------- DOCUMENTS ---------- */
export function DocumentsPanel() {
  const docs = [
    { name: 'Freight Services Agreement', pages: 12, tag: 'Contract', status: 'Analyzed' },
    { name: 'Witness Statement — J. Alvarez', pages: 3, tag: 'Statement', status: 'Analyzed' },
    { name: 'Witness Statement — R. Doyle', pages: 2, tag: 'Statement', status: 'Analyzed' },
    { name: 'Invoice #MF-4471', pages: 1, tag: 'Invoice', status: 'Analyzed' },
    { name: 'Delivery Log — Terminal 4', pages: 5, tag: 'Record', status: 'Analyzed' },
    { name: 'Formal Demand Letter', pages: 2, tag: 'Correspondence', status: 'Analyzed' },
  ]
  return (
    <Panel>
      <PanelHeader title="Documents" meta="14 files · 3 pending review" />
      <div className="space-y-2">
        {docs.map((d) => (
          <div
            key={d.name}
            className="flex items-center gap-3 rounded-lg border border-border bg-elevated/50 px-3 py-2.5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-elevated/80"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface">
              <FileText className="h-4 w-4 text-accent-ai" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-foreground">{d.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {d.tag} · {d.pages} {d.pages === 1 ? 'page' : 'pages'}
              </p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-success/25 bg-success/[0.06] px-2 py-0.5 text-[11px] text-success">
              <CheckCircle2 className="h-3 w-3" /> {d.status}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

/* ---------- TIMELINE ---------- */
const TIMELINE = [
  { date: 'Jan 12', label: 'Agreement executed', tone: 'default' },
  { date: 'Feb 28', label: 'Invoice issued', tone: 'default' },
  { date: 'Mar 3', label: 'Claimed delivery', tone: 'warning' },
  { date: 'Mar 5', label: 'Contractual deadline', tone: 'default' },
  { date: 'Mar 10', label: 'Conflicting delivery date', tone: 'error' },
  { date: 'Mar 14', label: 'Witness statement', tone: 'default' },
  { date: 'Mar 16', label: 'Witness statement', tone: 'default' },
  { date: 'Aug 25', label: 'Formal demand letter', tone: 'default' },
  { date: 'Sep 15', label: 'Response deadline', tone: 'ai' },
] as const

export function TimelinePanel() {
  return (
    <Panel>
      <PanelHeader title="Case timeline" meta="9 events" />
      <ol className="relative ml-1 space-y-3 border-l border-border pl-5">
        {TIMELINE.map((e, i) => (
          <Reveal as="li" key={e.date + e.label} variant="up-sm" delay={i * 70} className="relative" threshold={0.4}>
            <span
              className={cn(
                'absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-surface transition-transform duration-300',
                e.tone === 'error' && 'bg-error',
                e.tone === 'warning' && 'bg-warning',
                e.tone === 'ai' && 'bg-accent-ai',
                e.tone === 'default' && 'bg-muted-foreground',
              )}
            />
            <div className="flex items-baseline gap-3">
              <span className="w-12 shrink-0 text-[11px] font-medium text-muted-foreground">{e.date}</span>
              <span
                className={cn(
                  'text-[13px]',
                  e.tone === 'error' ? 'font-medium text-error' : 'text-foreground',
                )}
              >
                {e.label}
              </span>
            </div>
          </Reveal>
        ))}
      </ol>
    </Panel>
  )
}

/* ---------- GRAPH ---------- */
export function GraphPanel() {
  return (
    <Panel>
      <PanelHeader title="Evidence graph" meta="7 nodes · 5 relationships" />
      <GraphViz />
    </Panel>
  )
}

/* ---------- CHAT ---------- */
export function ChatPanel() {
  return (
    <Panel>
      <PanelHeader title="Ask Advoka about this case" />
      <div className="space-y-3">
        <Reveal variant="up-sm" className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm border border-border bg-elevated px-3.5 py-2.5">
          <p className="text-[13px] text-foreground">What are the key contradictions in this case?</p>
        </Reveal>
        <Reveal
          variant="up-sm"
          delay={260}
          className="max-w-[88%] rounded-2xl rounded-bl-sm border border-primary/25 bg-primary/[0.06] px-3.5 py-2.5"
        >
          <div className="mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-accent-ai" />
            <span className="text-[11px] font-medium text-accent-ai">Advoka</span>
          </div>
          <p className="text-[13px] leading-relaxed text-secondary-foreground">
            The evidence contains a conflict regarding both the delivery date and shipment quantity.
          </p>
          <Reveal
            delay={520}
            variant="fade"
            className="mt-2.5 flex items-center gap-2 rounded-md border border-border bg-surface/70 px-2.5 py-1.5 transition-colors duration-200 hover:border-primary/25"
          >
            <Quote className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Source</span>
            <span className="text-[11px] font-medium text-foreground">meridian-v-cascade-test-case.pdf</span>
            <span className="ml-auto text-[11px] text-muted-foreground">p.1</span>
          </Reveal>
        </Reveal>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5">
        <span className="text-[13px] text-muted-foreground">Ask a follow-up question…</span>
        <span className="ml-auto flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground transition-transform duration-200 hover:scale-105">
          <Send className="h-3.5 w-3.5" />
        </span>
      </div>
    </Panel>
  )
}

/* ---------- DRAFTS ---------- */
export function DraftsPanel() {
  return (
    <Panel>
      <PanelHeader title="New draft" meta="AI generated draft" />
      <Reveal variant="up-sm" className="mb-3 flex flex-wrap gap-2">
        {['Legal notice', 'Client email', 'Case summary', 'Reply', 'Application'].map((o, i) => (
          <span
            key={o}
            className={cn(
              'rounded-md border px-2.5 py-1 text-[12px] transition-colors duration-200',
              i === 0
                ? 'border-primary/40 bg-primary/10 text-foreground'
                : 'border-border bg-surface/60 text-muted-foreground hover:border-primary/25 hover:text-secondary-foreground',
            )}
          >
            {o}
          </span>
        ))}
      </Reveal>
      <Reveal variant="scale" delay={140}>
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-medium text-foreground">Legal notice — draft</span>
            <span className="inline-flex items-center gap-1 rounded-md border border-warning/25 bg-warning/[0.06] px-2 py-0.5 text-[10px] text-warning">
              <AlertTriangle className="h-3 w-3" /> Requires review
            </span>
          </div>
          <div className="space-y-1.5">
            {['RE: Meridian Freight Logistics v. Cascade Retail Group', 'Dear Counsel,', ''].map((line, i) => (
              <p key={i} className="text-[12px] leading-relaxed text-secondary-foreground">
                {line || '\u00A0'}
              </p>
            ))}
            <div className="space-y-1.5">
              {[
                { w: 'w-full', delay: 260 },
                { w: 'w-[92%]', delay: 320 },
                { w: 'w-[78%]', delay: 380 },
                { w: 'w-[85%]', delay: 440 },
              ].map((line, i) => (
                <Reveal key={i} variant="fade" delay={line.delay} className={cn('h-2 rounded bg-border/70', line.w)} />
              ))}
            </div>
          </div>
        </Card>
      </Reveal>
    </Panel>
  )
}

/* ---------- Shared graph viz (also used in feature section) ---------- */
function edgeLength([x1, y1]: number[], [x2, y2]: number[]) {
  return Math.hypot(x2 - x1, y2 - y1)
}

export function GraphViz({ className }: { className?: string }) {
  const edges = [
    ['200,40', '90,110'],
    ['200,40', '310,110'],
    ['90,110', '150,200'],
    ['310,110', '250,200'],
    ['90,110', '310,110'],
  ]

  return (
    <Reveal variant="fade" className={cn('relative aspect-[16/10] w-full', className)} threshold={0.3}>
      <svg viewBox="0 0 400 250" className="h-full w-full" role="img" aria-label="Graph of case evidence relationships">
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6" fill="none" stroke="#6F7685" strokeWidth="1" />
          </marker>
        </defs>
        {/* edges */}
        {edges.map(([a, b], i) => {
          const [x1, y1] = a.split(',').map(Number)
          const [x2, y2] = b.split(',').map(Number)
          const len = edgeLength([x1, y1], [x2, y2])
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={i === 4 ? '#FB7185' : '#252A36'}
              strokeWidth={i === 4 ? 1.5 : 1}
              strokeDasharray={i === 4 ? '4 3' : undefined}
              markerEnd="url(#arrow)"
              className={i === 4 ? undefined : 'draw-line'}
              style={i === 4 ? undefined : ({ '--len': len, '--delay': `${220 + i * 140}ms` } as React.CSSProperties)}
            />
          )
        })}
      </svg>

      {/* nodes overlaid for crisp text */}
      <GraphNode style={{ left: '50%', top: '16%' }} label="Witness" sub="J. Alvarez" tone="ai" delay={0} />
      <GraphNode style={{ left: '22.5%', top: '44%' }} label="Statement" sub="p.1" delay={120} />
      <GraphNode style={{ left: '77.5%', top: '44%' }} label="Statement" sub="p.1" delay={200} />
      <GraphNode style={{ left: '37.5%', top: '80%' }} label="Contradiction" sub="Delivery date" tone="error" delay={620} />
      <GraphNode style={{ left: '62.5%', top: '80%' }} label="Missing" sub="Bill of lading" tone="warning" delay={700} />
    </Reveal>
  )
}

function GraphNode({
  label,
  sub,
  tone = 'default',
  style,
  delay = 0,
}: {
  label: string
  sub: string
  tone?: 'default' | 'ai' | 'error' | 'warning'
  style?: React.CSSProperties
  delay?: number
}) {
  return (
    <div
      className={cn(
        'graph-node -translate-x-1/2 -translate-y-1/2 absolute flex flex-col items-center rounded-lg border px-2.5 py-1.5 text-center transition-colors duration-200',
        tone === 'default' && 'border-border bg-elevated hover:border-primary/25',
        tone === 'ai' && 'border-primary/40 bg-primary/10',
        tone === 'error' && 'border-error/40 bg-error/10',
        tone === 'warning' && 'border-warning/40 bg-warning/10',
      )}
      style={{ ...style, '--delay': `${delay}ms` } as React.CSSProperties}
    >
      <span
        className={cn(
          'text-[11px] font-medium leading-tight',
          tone === 'error' ? 'text-error' : tone === 'warning' ? 'text-warning' : tone === 'ai' ? 'text-accent-ai' : 'text-foreground',
        )}
      >
        {label}
      </span>
      <span className="text-[10px] leading-tight text-muted-foreground">{sub}</span>
    </div>
  )
}
