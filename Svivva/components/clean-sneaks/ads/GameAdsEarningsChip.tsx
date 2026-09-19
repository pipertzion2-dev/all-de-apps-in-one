"use client";

import { useEffect, useState } from "react";
import { readAdEarnings, type AdEarningsSnapshot } from "@/lib/clean-sneaks/ads";

/** Tiny owner-facing chip — local estimate until AdSense payout reports land. */
export function GameAdsEarningsChip({ className }: { className?: string }) {
  const [snap, setSnap] = useState<AdEarningsSnapshot | null>(null);

  useEffect(() => {
    setSnap(readAdEarnings());
    const onStorage = () => setSnap(readAdEarnings());
    window.addEventListener("storage", onStorage);
    const id = window.setInterval(onStorage, 4000);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(id);
    };
  }, []);

  if (!snap || snap.impressions === 0) return null;

  return (
    <p
      className={`text-[10px] tabular-nums text-white/40 ${className ?? ""}`}
      data-testid="game-ads-earnings"
      title="Local estimate from impressions — actual payout is in Google AdSense"
    >
      Ads · {snap.impressions} views · ~${snap.estimatedUsd.toFixed(2)} est.
    </p>
  );
}
