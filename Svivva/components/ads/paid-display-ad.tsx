"use client";

import { useEffect, useState } from "react";
import { AdSenseSlot } from "@/components/clean-sneaks/ads/AdSenseSlot";
import { adsEnabled, resolveAdNetwork, type AdPlacementId } from "@/lib/clean-sneaks/ads";

type Props = {
  /** Defaults to hub index / feature pages. */
  placement?: AdPlacementId;
  className?: string;
  compactLabel?: boolean;
};

/**
 * Google AdSense display unit — real paid inventory when slot ids are configured
 * (Orbit → AdSense or NEXT_PUBLIC_ADSENSE_SLOT* env).
 */
export function PaidDisplayAd({
  placement = "hub_display",
  className = "",
  compactLabel = false,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [filled, setFilled] = useState<boolean | null>(null);

  useEffect(() => setMounted(true), []);

  if (!mounted || !adsEnabled()) return null;

  const network = resolveAdNetwork(placement);
  if (network !== "adsense") return null;
  if (filled === false) return null;

  return (
    <aside
      className={`w-full overflow-hidden rounded-lg border border-white/10 bg-black/30 ${className}`}
      aria-label="Advertisement"
      data-testid="paid-display-ad"
    >
      {!compactLabel && (
        <p className="px-3 pt-2 text-[9px] uppercase tracking-[0.28em] text-white/40">
          Advertisement
        </p>
      )}
      <div className={compactLabel ? "p-2" : "px-3 pb-3"}>
        <AdSenseSlot
          placement={placement}
          className="min-h-[90px] w-full"
          onFillChange={setFilled}
        />
      </div>
    </aside>
  );
}
