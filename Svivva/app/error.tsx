"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("ZZAI page error:", error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center bg-background text-foreground">
      <div className="max-w-md space-y-4">
        <h1 className="text-xl font-bold">This page couldn&apos;t load</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Reload to try again, or go back to the ZZAI homepage.
        </p>
        <div className="flex flex-col gap-2">
          <Button type="button" onClick={() => reset()}>
            Reload
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/">Back</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
