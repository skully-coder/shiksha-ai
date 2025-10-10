import { Skeleton } from "@/components/ui/skeleton";
import PageSkeleton from "./PageSkeleton";

export default function FeaturePageSkeleton({ cardCount = 6 }: { cardCount?: number }) {
  return (
    <PageSkeleton className="flex flex-col space-y-6 items-center">
      <Skeleton className="h-10 w-1/3" /> {/* Page Title */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-4xl">
        {Array.from({ length: cardCount }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    </PageSkeleton>
  );
}
