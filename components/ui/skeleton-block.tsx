import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * §21 Loading states — skeleton screens for anything that fetches data.
 * Built once on Day 2 (case list / dashboard), reused for every screen with
 * real data fetching the rest of the week.
 */
export function SkeletonBlock({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col gap-3 p-5">
        <Skeleton className="h-4 w-1/3" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" style={{ width: `${100 - i * 12}%` }} />
        ))}
      </CardContent>
    </Card>
  );
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-md border border-border bg-surface p-4",
        className
      )}
    >
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-6 w-20 rounded-sm" />
    </div>
  );
}
