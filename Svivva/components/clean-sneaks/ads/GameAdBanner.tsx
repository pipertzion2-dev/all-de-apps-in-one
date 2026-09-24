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

export function GameAdBanner({ className, compact = false }: Props) {
  const [mounted, setMounted] = useState(false);
  /** null = waiting on Google fill; false = unfilled (hide); true = show chrome */
  const [adsenseFilled, setAdsenseFilled] = useState<boolean | null>(null);
  const creative = useMemo(() => pickHouseCreative(Date.now()), []);
  const network = resolveAdNetwork("menu_banner");
  const show = adsEnabled() && mounted;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!show || network !== "house") return;
    recordAdEvent({ placement: "menu_banner", kind: "impression", network: "house" });
    markAdCooldown("menu_banner");
  }, [show, network]);

  if (!show) return null;

  // No slot / house creative — stay quiet. Auto ads still run from the layout script.
  // Setup instructions live in Orbit → AdSense, not in the game shell.
  if (network === "unconfigured") return null;

  // Hide the whole “Advertisement” chrome when Google returns no fill (blank unit).
  if (network === "adsense" && adsenseFilled === false) return null;

  const waitingOnFill = network === "adsense" && adsenseFilled !== true;

  return (
    <aside
      className={`w-full overflow-hidden rounded-lg border backdrop-blur-sm ${
        waitingOnFill
          ? "border-transparent bg-transparent px-0 py-0"
          : `border-white/10 bg-black/40 ${compact ? "px-2 py-1.5" : "px-3 py-2.5"}`
      } ${className ?? ""}`}
      aria-label="Advertisement"
      aria-hidden={waitingOnFill ? true : undefined}
      data-testid="game-ad-banner"
    >
      {!waitingOnFill && (
        <p className="mb-1 text-[9px] uppercase tracking-[0.28em] text-white/40">Advertisement</p>
      )}
      {network === "adsense" ? (
        <AdSenseSlot
          placement="menu_banner"
          className="min-h-[60px] w-full"
          onFillChange={setAdsenseFilled}
        />
      ) : houseAdsAllowed() ? (
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
      ) : null}
    </aside>
  );
}
