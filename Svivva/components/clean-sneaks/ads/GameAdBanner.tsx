"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  adsEnabled,
  houseAdsAllowed,
  markAdCooldown,
  pickHouseCreative,
  recordAdEvent,
  resolveAdNetwork,
} from "@/lib/clean-sneaks/ads";
import { AdSenseSlot } from "./AdSenseSlot";

type Props = {
  className?: string;
  compact?: boolean;
};

function HouseBanner({
  className,
  compact,
  creative,
}: {
  className?: string;
  compact: boolean;
  creative: ReturnType<typeof pickHouseCreative>;
}) {
  return (
    <aside
      className={`w-full overflow-hidden rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm ${
        compact ? "px-2 py-1.5" : "px-3 py-2.5"
      } ${className ?? ""}`}
      aria-label="Advertisement"
      data-testid="game-ad-banner"
    >
      <p className="mb-1 text-[9px] uppercase tracking-[0.28em] text-white/40">Advertisement</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-sm font-medium text-white/90"
            style={{ color: creative.accent }}
          >
            {creative.headline}
          </p>
          {!compact && (
            <p className="mt-0.5 line-clamp-2 text-[11px] text-white/55">{creative.body}</p>
          )}
        </div>
        <Link
          href={creative.href}
          className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium text-[#0a0c10]"
          style={{ background: creative.accent }}
          onClick={() =>
            recordAdEvent({ placement: "menu_banner", kind: "click", network: "house" })
          }
          data-testid="game-ad-banner-cta"
        >
          {creative.cta}
        </Link>
      </div>
    </aside>
  );
}

export function GameAdBanner({ className, compact = false }: Props) {
  const [mounted, setMounted] = useState(false);
  /** null = waiting on Google fill; false = unfilled → house; true = show Google */
  const [adsenseFilled, setAdsenseFilled] = useState<boolean | null>(null);
  const creative = useMemo(() => pickHouseCreative(Date.now()), []);
  const network = resolveAdNetwork("menu_banner");
  const show = adsEnabled() && mounted;
  const useHouse =
    network === "house" || (network === "adsense" && adsenseFilled === false && houseAdsAllowed());

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!show || !useHouse) return;
    recordAdEvent({ placement: "menu_banner", kind: "impression", network: "house" });
    markAdCooldown("menu_banner");
  }, [show, useHouse]);

  if (!show) return null;
  if (network === "unconfigured" && !houseAdsAllowed()) return null;

  if (useHouse) {
    return <HouseBanner className={className} compact={compact} creative={creative} />;
  }

  if (network === "adsense") {
    const filled = adsenseFilled === true;
    return (
      <aside
        className={
          filled
            ? `w-full overflow-hidden rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm ${
                compact ? "px-2 py-1.5" : "px-3 py-2.5"
              } ${className ?? ""}`
            : "contents"
        }
        aria-label={filled ? "Advertisement" : undefined}
        aria-hidden={filled ? undefined : true}
        data-testid="game-ad-banner"
      >
        {filled && (
          <p className="mb-1 text-[9px] uppercase tracking-[0.28em] text-white/40">Advertisement</p>
        )}
        <AdSenseSlot
          placement="menu_banner"
          className="min-h-[60px] w-full"
          onFillChange={setAdsenseFilled}
        />
      </aside>
    );
  }

  return null;
}
