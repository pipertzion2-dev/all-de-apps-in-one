import { readAdFreePass } from "@/lib/clean-sneaks/monetization/ad-free-pass";
import type { AdPlacementId, HouseCreative } from "./types";
import { kleanInGameUsesAdsense } from "./google-in-game";
import {
  configuredProgrammaticNetworks,
  preferProgrammaticOverAdsense,
  programmaticNetwork,
} from "./programmatic";
import { pickFromPaidCandidates, type PaidInGameNetwork } from "./paid-rotation";
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
 * Google AdSense (optional in-game — off by default; see google-in-game.ts).
 * Free networks: Monetag / Adsterra / Media.net via programmatic.ts env vars.
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
  if (typeof window !== "undefined" && readAdFreePass()) return false;
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

/** Real paid networks available for a placement (excludes house fill). */
export function paidAdCandidates(placement: AdPlacementId): PaidInGameNetwork[] {
  const out: PaidInGameNetwork[] = [];
  if (placement === "menu_banner") {
    for (const network of configuredProgrammaticNetworks()) out.push(network);
  }
  if (kleanInGameUsesAdsense() && adsenseUnitReady(placement)) {
    out.push("adsense");
  }
  return out;
}

/**
 * Prefer paid inventory (AdSense + alt networks) with rotation when more than one
 * is configured. House sponsors are fill only when nothing paid is wired or the
 * UI falls back after an unfilled Google slot.
 */
export function resolveAdNetwork(
  placement: AdPlacementId,
): "adsense" | "house" | "unconfigured" | "medianet" | "adsterra" | "monetag" {
  if (!adsEnabled()) return "unconfigured";

  const paid = paidAdCandidates(placement);
  if (paid.length > 1) {
    const picked = pickFromPaidCandidates(placement, paid);
    if (picked) return picked;
  }
  if (paid.length === 1) return paid[0]!;

  if (placement === "menu_banner") {
    const programmatic = programmaticNetwork();
    if (programmatic && preferProgrammaticOverAdsense()) return programmatic;
  }

  if (houseAdsAllowed()) return "house";

  if (kleanInGameUsesAdsense() && adsenseUnitReady(placement)) return "adsense";
  const programmatic = programmaticNetwork();
  if (programmatic && placement === "menu_banner") return programmatic;
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
    id: "rest-grow",
    headline: "Give your project rest to grow",
    body: "Let the sap do the quiet work — schema, rollback, guardrails — while you focus elsewhere.",
    cta: "Explore ZZAI",
    href: "/",
    accent: "#5B8DA8",
    imageUrl: "/zzai-logo-signal.png",
  },
  {
    id: "zzai-tools",
    headline: "ZZAI Tools Hub",
    body: "Ship prompts as live APIs — free tools that grow with you.",
    cta: "Open hub",
    href: "/ai-tools-hub",
    accent: "#5B8DA8",
    imageUrl: "/zzai-logo-signal.png",
  },
  {
    id: "clutety",
    headline: "Clutety Shield",
    body: "Cut feed noise. Keep the focus on what you actually want to ship.",
    cta: "Try Clutety",
    href: "/clutety",
    accent: "#7EC8D9",
    imageUrl: "/clutety-logo.png",
  },
  {
    id: "baloon8",
    headline: "Baloon8 Drops",
    body: "The car-sneaker that started this walk. Fresh colorways inside.",
    cta: "See kicks",
    href: "/clean-sneaks",
    accent: "#D94F9C",
    imageUrl: "/assets/clean-sneaks/baloon8-hero-reference.jpg",
  },
] as const;
