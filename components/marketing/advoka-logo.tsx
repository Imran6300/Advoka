import Image from 'next/image'
import { cn } from '@/lib/utils'

export function AdvokaMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={32}
      height={32}
      priority
      className={cn('h-8 w-8 shrink-0 rounded-lg object-cover', className)}
    />
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
