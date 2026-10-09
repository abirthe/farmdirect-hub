import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div 
      className="container py-8 max-w-6xl space-y-6 animate-pulse"
      role="status"
      aria-label="Loading page content"
      aria-busy="true"
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-96 rounded-md" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>

      <div className="grid gap-6 md:grid-cols-3 pt-2">
        <Skeleton className="h-72 rounded-2xl md:col-span-2" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
