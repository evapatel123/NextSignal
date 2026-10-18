import { Skeleton } from "@/components/ui/skeleton";

export function MetricSkeleton() {
  return <Skeleton className="h-28" />;
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10" />
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return <Skeleton style={{ height }} />;
}
