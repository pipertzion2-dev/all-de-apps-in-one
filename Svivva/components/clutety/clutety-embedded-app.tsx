"use client";

import { LockScanner } from "@/components/clutety/lock-scanner";

/** @deprecated Use {@link ClutetyAppFrame} on the landing page or `/clutety/embed` directly. */
export function ClutetyEmbeddedApp() {
  return (
    <div className="min-h-[560px] w-full">
      <LockScanner />
    </div>
  );
}
