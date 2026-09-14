"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function CleanSneaksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Clean Sneaks failed to load:", error);
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0a0c10] px-6 text-center text-foreground">
      <div className="max-w-md space-y-4">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#5B8DA8]">Clean Sneaks</p>
        <h1 className="text-xl font-bold">Game couldn&apos;t load</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Try again, or head back to the ZZAI homepage. If you&apos;re on mobile, closing other tabs
          can help free memory for the game.
        </p>
        <div className="flex flex-col gap-2">
          <Button type="button" className="bg-[#5B8DA8] text-white" onClick={() => reset()}>
            Try again
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/clean-sneaks">Reload game</Link>
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link href="/#clean-sneaks">Back to homepage</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
