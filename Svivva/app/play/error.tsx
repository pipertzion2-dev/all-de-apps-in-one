"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function PlayError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Svivva Play failed to load:", error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white text-gray-900">
      <div className="border-b-2 border-amber-500 bg-amber-50 px-4 py-3 text-center">
        <p className="text-sm font-semibold text-amber-950">
          <span className="inline-block rounded bg-amber-500 px-2 py-0.5 text-xs font-bold text-white mr-2">
            BETA
          </span>
          Svivva Play is in beta — loading errors can happen while we ship updates.
        </p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-2">Svivva Play could not load</h1>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          This is usually a temporary browser or network issue. Refresh the page, or return home
          and open Play again.
        </p>
        <div className="flex flex-col gap-2 w-full">
          <Button type="button" onClick={() => reset()}>
            Try again
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/play">Reload Play</Link>
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link href="/">Back to Svivva home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
