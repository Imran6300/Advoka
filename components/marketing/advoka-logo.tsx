import { cn } from '@/lib/utils'

export function AdvokaMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative inline-flex h-8 w-8 items-center justify-center rounded-lg',
        'bg-gradient-to-br from-primary to-accent-ai',
        className,
      )}
      aria-hidden="true"
    >
      {/* Stylized "A" / scales-of-justice hybrid mark */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-primary-foreground">
        <path d="M12 3L6 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 3L18 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8.4 14H15.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  )
}

export function AdvokaLogo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <AdvokaMark />
      <span className="text-[17px] font-semibold tracking-tight text-foreground">Advoka</span>
    </span>
  )
}
