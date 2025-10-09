"use client";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center space-y-4">
      <h1 className="text-4xl font-semibold">Page Not Found</h1>
      <p className="text-muted-foreground">
        Oops! The page you’re looking for doesn’t exist.
      </p>
      <Button onClick={() => window.history.back()}>Go Back</Button>
    </div>
  );
}
