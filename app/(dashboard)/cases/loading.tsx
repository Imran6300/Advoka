import { SkeletonRow } from "@/components/ui/skeleton-block";

export default function CasesLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-32 animate-shimmer rounded-sm skeleton-shimmer" />
          <div className="h-4 w-64 animate-shimmer rounded-sm skeleton-shimmer" />
        </div>
        <div className="h-10 w-40 shrink-0 animate-shimmer rounded-sm skeleton-shimmer" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}
