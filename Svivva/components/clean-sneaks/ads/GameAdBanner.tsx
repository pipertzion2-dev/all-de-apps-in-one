"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  adsEnabled,
  adsenseConfigured,
  adsenseUnitReady,
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
  const creative = useMemo(() => pickHouseCreative(Date.now()), []);
  const network = resolveAdNetwork("menu_banner");
  const unitReady = adsenseUnitReady("menu_banner");
  const show = adsEnabled() && mounted;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!show || network !== "house") return;
    recordAdEvent({ placement: "menu_banner", kind: "impression", network: "house" });
    markAdCooldown("menu_banner");
  }, [show, network]);

  if (!show) return null;

  if (network === "unconfigured") {
    return (
      <aside
        className={`w-full rounded-lg border border-dashed border-[#d4af37]/35 bg-black/30 px-3 py-2 ${className ?? ""}`}
        data-testid="game-ad-banner-setup"
      >
        <p className="text-[9px] uppercase tracking-[0.28em] text-[#d4af37]/80">AdSense</p>
        <p className="mt-1 text-[11px] text-white/65">
          Paid Google ads are off until you add your publisher id in Orbit → AdSense (ca-pub-…).
          {adsenseConfigured() ? null : null}
        </p>
        <a
          className="mt-1 inline-block text-[11px] text-[#7EC8D9] underline-offset-2 hover:underline"
          href="https://www.google.com/adsense/start"
          target="_blank"
          rel="noreferrer"
        >
          Open AdSense →
        </a>
      </aside>
    );
  }

  // Publisher live + Auto ads OK, but no Display slot for the in-game banner yet.
  if (network === "adsense" && !unitReady) {
    return (
      <aside
        className={`w-full rounded-lg border border-dashed border-[#d4af37]/35 bg-black/30 px-3 py-2 ${className ?? ""}`}
        data-testid="game-ad-banner-need-slot"
      >
        <p className="text-[9px] uppercase tracking-[0.28em] text-[#d4af37]/80">
          Next · Display ad unit
        </p>
        <p className="mt-1 text-[11px] text-white/65">
          Auto ads can run site-wide. For this banner, create a Display unit and paste the slot in
          Orbit.
        </p>
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
          <a
            className="text-[#7EC8D9] underline-offset-2 hover:underline"
            href="https://adsense.google.com/adsense/new/myads/units"
            target="_blank"
            rel="noreferrer"
          >
            Create Display unit →
          </a>
          <Link
            href="/dashboard/launchpad"
            className="text-[#ffd76a] underline-offset-2 hover:underline"
          >
            Paste in Orbit
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`w-full overflow-hidden rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm ${
        compact ? "px-2 py-1.5" : "px-3 py-2.5"
      } ${className ?? ""}`}
      aria-label="Advertisement"
      data-testid="game-ad-banner"
    >
      <p className="mb-1 text-[9px] uppercase tracking-[0.28em] text-white/40">Advertisement</p>
      {network === "adsense" ? (
        <AdSenseSlot placement="menu_banner" className="min-h-[60px] w-full" />
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
