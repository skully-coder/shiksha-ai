"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center space-y-6 bg-gray-50">
      <h1 className="text-3xl font-semibold text-red-600">Something went wrong</h1>
      <p className="text-gray-700">{error.message || "We couldn’t load this page properly."}</p>
      <Button
        className="bg-red-600 hover:bg-red-700 text-white"
        onClick={() => reset()}
      >
        Retry
      </Button>
    </div>
  );
}
