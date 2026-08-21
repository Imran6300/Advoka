'use client'

import { useState } from 'react'
import {
  LayoutDashboard,
  FileText,
  CalendarClock,
  Share2,
  MessageSquareText,
  PenLine,
} from 'lucide-react'
import { SectionHeading } from '@/components/marketing/section-heading'
import { Reveal } from '@/components/marketing/reveal'
import { AppWindow, type AppTab } from '@/components/marketing/product/app-window'
import {
  OverviewPanel,
  DocumentsPanel,
  TimelinePanel,
  GraphPanel,
  ChatPanel,
  DraftsPanel,
} from '@/components/marketing/product/panels'

const TABS: { id: AppTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'timeline', label: 'Timeline', icon: CalendarClock },
  { id: 'graph', label: 'Graph', icon: Share2 },
  { id: 'chat', label: 'Chat', icon: MessageSquareText },
  { id: 'drafts', label: 'Drafts', icon: PenLine },
]

const PANELS: Record<AppTab, React.ReactNode> = {
  overview: <OverviewPanel />,
  documents: <DocumentsPanel />,
  timeline: <TimelinePanel />,
  graph: <GraphPanel />,
  chat: <ChatPanel />,
  drafts: <DraftsPanel />,
}

export function ProductTour() {
  const [active, setActive] = useState<AppTab>('overview')

  return (
    <section id="product" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
      <SectionHeading
        eyebrow="Product tour"
        title="One workspace for the whole case."
        description="Move between the overview, documents, timeline, graph, chat and drafts — all working from the same source of evidence."
      />

      {/* Tabs */}
      <Reveal delay={80}>
        <div
          role="tablist"
          aria-label="Product areas"
          className="mx-auto mt-10 flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-xl border border-border bg-surface/60 p-1.5"
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = id === active
            return (
              <button
                key={id}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => setActive(id)}
                className={
                  'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ' +
                  (isActive
                    ? 'bg-primary/15 text-foreground'
                    : 'text-muted-foreground hover:bg-elevated hover:text-secondary-foreground')
                }
              >
                <Icon className={'h-4 w-4 ' + (isActive ? 'text-accent-ai' : '')} />
                {label}
              </button>
            )
          })}
        </div>
      </Reveal>

      <Reveal delay={140} className="mt-8">
        <div className="[perspective:2000px]">
          <div className="mx-auto max-w-4xl">
            <AppWindow key={active} activeTab={active} className="reveal is-visible tab-switch">
              {PANELS[active]}
            </AppWindow>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
