import PageSkeleton from "./PageSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileSkeleton() {
  return (
    <PageSkeleton>
      <div className="space-y-4 w-full max-w-md">
        <Skeleton className="h-10 w-1/2 rounded-md" />
        <Skeleton className="h-6 w-1/3 rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </PageSkeleton>
  );
}
