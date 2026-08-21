import type { ReactNode } from 'react'
import {
  LayoutDashboard,
  FileText,
  CalendarClock,
  Share2,
  MessageSquareText,
  PenLine,
  Search,
  Scale,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'timeline', label: 'Timeline', icon: CalendarClock },
  { id: 'graph', label: 'Graph', icon: Share2 },
  { id: 'chat', label: 'Chat', icon: MessageSquareText },
  { id: 'drafts', label: 'Drafts', icon: PenLine },
] as const

export type AppTab = (typeof NAV)[number]['id']

export function AppWindow({
  activeTab = 'overview',
  children,
  className,
}: {
  activeTab?: AppTab
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-surface',
        'shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_40px_120px_-40px_rgba(0,0,0,0.8)]',
        'transition-colors duration-500 ease-out hover:border-primary/25',
        className,
      )}
    >
      {/* Title bar */}
      <div className="flex items-center gap-3 border-b border-border bg-elevated/60 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-error/70" />
          <span className="h-3 w-3 rounded-full bg-warning/70" />
          <span className="h-3 w-3 rounded-full bg-success/70" />
        </div>
        <div className="ml-2 flex items-center gap-2 text-muted-foreground">
          <Scale className="h-3.5 w-3.5 text-accent-ai" />
          <span className="text-xs font-medium text-secondary-foreground">Advoka</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-xs text-muted-foreground">Meridian Freight Logistics v. Cascade Retail Group</span>
        </div>
        <div className="ml-auto hidden items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground sm:flex">
          <Search className="h-3 w-3" />
          <span>Search case</span>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <nav className="hidden w-44 shrink-0 flex-col gap-0.5 border-r border-border bg-elevated/30 p-2.5 sm:flex">
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = id === activeTab
            return (
              <div
                key={id}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-all duration-200 ease-out',
                  active
                    ? 'bg-primary/12 text-foreground'
                    : 'text-muted-foreground hover:bg-elevated/70 hover:text-secondary-foreground',
                )}
              >
                <Icon className={cn('h-4 w-4 transition-colors', active ? 'text-accent-ai' : 'text-muted-foreground')} />
                <span className={active ? 'font-medium' : ''}>{label}</span>
              </div>
            )
          })}
          <div className="mt-auto rounded-md border border-border bg-surface/60 p-2.5 transition-colors duration-200 hover:border-primary/25">
            <p className="text-[11px] text-muted-foreground">Processing complete</p>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-primary to-accent-ai" />
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1 bg-[radial-gradient(120%_120%_at_100%_0%,rgba(91,91,214,0.06),transparent_50%)]">
          {children}
        </div>
      </div>
    </div>
  )
}
