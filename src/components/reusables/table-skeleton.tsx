import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder shaped like the tables it replaces. */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="border bg-card" aria-busy="true" aria-label="Loading">
      <div className="border-b bg-muted px-4 py-3">
        <Skeleton className="h-3 w-40" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0"
        >
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
