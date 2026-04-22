import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonCardProps {
  variant?: "default" | "dashboard";
}

export function SkeletonCard({ variant = "default" }: SkeletonCardProps) {
  const cardClass =
    variant === "dashboard"
      ? "rounded-xl border-0 shadow overflow-hidden p-6"
      : "rounded-lg border border-border p-6";

  return (
    <Card className={cardClass}>
      <CardHeader className="p-0 pb-2">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="p-0 pt-2">
        <Skeleton className="mb-2 h-8 w-16" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface SkeletonListProps {
  variant?: "default" | "dashboard";
}

export function SkeletonList({ variant = "default" }: SkeletonListProps) {
  const itemClass =
    variant === "dashboard" ? "rounded-xl bg-card p-4 shadow" : "rounded-lg border border-border p-4";

  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={itemClass}>
          <div className="flex items-start gap-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
