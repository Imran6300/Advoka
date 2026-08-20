import { SkeletonBlock, SkeletonRow } from "@/components/ui/skeleton-block";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8 pb-16">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-56 animate-shimmer rounded-sm skeleton-shimmer" />
          <div className="h-4 w-72 animate-shimmer rounded-sm skeleton-shimmer" />
        </div>
        <div className="h-10 w-40 shrink-0 animate-shimmer rounded-sm skeleton-shimmer" />
      </div>

      <SkeletonBlock rows={2} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} rows={1} />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}
