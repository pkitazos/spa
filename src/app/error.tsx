"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[60dvh] flex-col items-center justify-center gap-6">
      <h2 className="text-xl">Something went wrong!</h2>
      <Button variant="destructive" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
