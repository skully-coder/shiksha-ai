import { Skeleton } from "@/components/ui/skeleton";
import PageSkeleton from "./PageSkeleton";

export default function AdminSkeleton() {
  return (
    <PageSkeleton>
      <div className="w-full max-w-6xl space-y-4">
        <Skeleton className="h-10 w-1/4" /> {/* Header */}
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </PageSkeleton>
  );
}
