import { cn } from "@/lib/utils";

export default function PageSkeleton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-screen items-center justify-center bg-background p-6", className)}>
      {children}
    </div>
  );
}
