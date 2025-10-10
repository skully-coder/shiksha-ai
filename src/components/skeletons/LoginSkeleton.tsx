import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PageSkeleton from "./PageSkeleton";

export default function LoginSkeleton() {
  return (
    <PageSkeleton>
      <Card className="w-full max-w-sm space-y-6">
        <CardHeader className="text-center space-y-2">
          <Skeleton className="h-8 w-40 mx-auto" />  {/* Title */}
          <Skeleton className="h-4 w-56 mx-auto" />  {/* Subtitle */}
        </CardHeader>
        <CardContent className="space-y-5">
          <Skeleton className="h-10 w-full" />  {/* Email */}
          <Skeleton className="h-10 w-full" />  {/* Password */}
          <Skeleton className="h-10 w-full" />  {/* Button */}
        </CardContent>
      </Card>
    </PageSkeleton>
  );
}
