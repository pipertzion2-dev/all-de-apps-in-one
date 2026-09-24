import type { AdPlacementId, HouseCreative } from "./types";
import {
  isValidAdsenseClientId,
  isValidAdsenseSlotId,
  resolveSiteAdsenseClient,
} from "@/lib/adsense-credentials";

declare global {
  interface Window {
    __ADSENSE_CLIENT__?: string;
    __ADSENSE_SLOT_BANNER__?: string;
    __ADSENSE_SLOT_INTERSTITIAL__?: string;
    __ADSENSE_SLOT_REWARDED__?: string;
  }
}

function readRuntimeClient(): string | null {
  if (typeof window !== "undefined") {
    const w = window.__ADSENSE_CLIENT__?.trim();
    if (isValidAdsenseClientId(w)) return w!;
  }
  return resolveSiteAdsenseClient();
}

function readRuntimeSlot(placement: AdPlacementId): string | null {
  const winKey =
    placement === "menu_banner"
      ? "__ADSENSE_SLOT_BANNER__"
      : placement === "run_interstitial"
        ? "__ADSENSE_SLOT_INTERSTITIAL__"
        : "__ADSENSE_SLOT_REWARDED__";
  if (typeof window !== "undefined") {
    const w = window[winKey]?.trim();
    if (isValidAdsenseSlotId(w)) return w!;
  }
  const map: Record<AdPlacementId, string | undefined> = {
    menu_banner: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER?.trim(),
    run_interstitial: process.env.NEXT_PUBLIC_ADSENSE_SLOT_INTERSTITIAL?.trim(),
    rewarded_credits: process.env.NEXT_PUBLIC_ADSENSE_SLOT_REWARDED?.trim(),
  };
  const slot = map[placement];
  return isValidAdsenseSlotId(slot) ? slot! : null;
}

/**
 * Real paid ads = Google AdSense.
 * Configure in Orbit admin → AdSense tab (stores in Platform Secrets) or Vercel env.
 */
export function adsenseClientId(): string | null {
  return readRuntimeClient();
}

/** pub-XXXX form for ads.txt */
export function adsensePublisherId(): string | null {
  const client = adsenseClientId();
  if (client) return client.replace(/^ca-/, "");
  const pub = process.env.ADSENSE_PUB_ID?.trim() || "";
  if (pub.startsWith("pub-")) return pub;
  if (pub.startsWith("ca-pub-")) return pub.slice(3);
  return null;
}

export function adsenseSlot(placement: AdPlacementId): string | null {
  return readRuntimeSlot(placement);
}

/** Any configured display slot — used when a placement-specific slot is missing. */
export function adsenseAnySlot(): string | null {
  return (
    adsenseSlot("menu_banner") ||
    adsenseSlot("run_interstitial") ||
    adsenseSlot("rewarded_credits") ||
    null
  );
}

export function adsEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_CLEAN_SNEAKS_ADS === "0") return false;
  return true;
}

/**
 * House/sponsor creatives — on by default so players always see an ad when
 * Google has no fill. Set NEXT_PUBLIC_CLEAN_SNEAKS_HOUSE_ADS=0 to disable.
 */
export function houseAdsAllowed(): boolean {
  return process.env.NEXT_PUBLIC_CLEAN_SNEAKS_HOUSE_ADS !== "0";
}

/** True when Google AdSense publisher id is configured (real paid network). */
export function adsenseConfigured(): boolean {
  return Boolean(adsenseClientId());
}

/**
 * True when a Display unit slot is available for this placement.
 * Interstitial / rewarded need their own unit id — copying the banner slot produces
 * blank white ads. Banner may fall back to any configured display slot.
 * Publisher id alone is enough for Auto ads; unit placements need a slot id.
 */
export function adsenseUnitReady(placement: AdPlacementId): boolean {
  if (!adsenseClientId()) return false;
  const own = adsenseSlot(placement);
  if (!own) {
    return placement === "menu_banner" ? Boolean(adsenseAnySlot()) : false;
  }
  // Same Display unit pasted into interstitial/rewarded → Google often serves a blank.
  if (placement !== "menu_banner") {
    const banner = adsenseSlot("menu_banner");
    if (banner && banner === own) return false;
  }
  return true;
}

/**
 * Prefer paid AdSense for the menu banner when a unit is ready.
 * Rewarded + interstitial always use house creatives first — Google Display
 * units rarely fill there and left players staring at blank boxes. Auto ads
 * still run sitewide from the layout script for paid inventory.
 */
export function resolveAdNetwork(placement: AdPlacementId): "adsense" | "house" | "unconfigured" {
  if (!adsEnabled()) return "unconfigured";
  if (placement === "menu_banner" && adsenseUnitReady(placement)) return "adsense";
  if (houseAdsAllowed()) return "house";
  if (adsenseUnitReady(placement)) return "adsense";
  return "unconfigured";
}

/** Conservative display CPM used only for local earnings estimates. */
export const ESTIMATED_DISPLAY_CPM_USD = 2.4;
/** Higher estimate for completed rewarded views. */
export const ESTIMATED_REWARDED_CPM_USD = 9.5;

export const REWARDED_CREDITS = 75;
export const REWARDED_COOLDOWN_MS = 90_000;
export const INTERSTITIAL_COOLDOWN_MS = 45_000;

/** Direct / house sponsors — shown when Google has no fill (default on). */
export const HOUSE_CREATIVES: readonly HouseCreative[] = [
  {
    id: "zzai-tools",
    headline: "ZZAI Tools Hub",
    body: "Ship prompts as live APIs — free tools that grow with you.",
    cta: "Open hub",
    href: "/ai-tools-hub",
    accent: "#5B8DA8",
  },
  {
    id: "clutety",
    headline: "Clutety Shield",
    body: "Cut feed noise. Keep the focus on what you actually want to ship.",
    cta: "Try Clutety",
    href: "/clutety",
    accent: "#7EC8D9",
  },
  {
    id: "baloon8",
    headline: "Baloon8 Drops",
    body: "The car-sneaker that started this walk. Fresh colorways inside.",
    cta: "See kicks",
    href: "/clean-sneaks",
    accent: "#D94F9C",
  },
] as const;
