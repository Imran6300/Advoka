import { SkeletonBlock } from "@/components/ui/skeleton-block";

export default function CaseDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="h-7 w-72 animate-shimmer rounded-sm skeleton-shimmer" />
        <div className="h-4 w-96 animate-shimmer rounded-sm skeleton-shimmer" />
      </div>
      <div className="h-10 w-full max-w-xl animate-shimmer rounded-md skeleton-shimmer" />
      <SkeletonBlock rows={4} />
    </div>
  );
}
