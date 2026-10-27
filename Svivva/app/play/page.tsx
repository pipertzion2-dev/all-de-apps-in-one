"use client";

import { Suspense } from "react";
import { PlayHubClient } from "@/components/play/play-hub-client";

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-[#F7FBFC] text-sm text-muted-foreground">
          Loading Play…
        </div>
      }
    >
      <PlayHubClient />
    </Suspense>
  );
}
