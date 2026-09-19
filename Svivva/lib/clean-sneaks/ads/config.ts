import type { AdPlacementId, HouseCreative } from "./types";

/**
 * Real paid ads = Google AdSense.
 *
 * 1. https://www.google.com/adsense/start — create/sign in
 * 2. Add site zzaizzai.com, wait for approval
 * 3. Sites → turn on Auto ads (recommended) OR create Display ad units
 * 4. Vercel → Production env:
 *      NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
 *      NEXT_PUBLIC_ADSENSE_SLOT_BANNER=…          (optional if Auto ads on)
 *      NEXT_PUBLIC_ADSENSE_SLOT_INTERSTITIAL=…
 *      NEXT_PUBLIC_ADSENSE_SLOT_REWARDED=…
 * 5. Redeploy — live Google ads replace placeholders
 */
export function adsenseClientId(): string | null {
  const raw = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || "";
  return raw.startsWith("ca-pub-") ? raw : null;
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
  const map: Record<AdPlacementId, string | undefined> = {
    menu_banner: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER?.trim(),
    run_interstitial: process.env.NEXT_PUBLIC_ADSENSE_SLOT_INTERSTITIAL?.trim(),
    rewarded_credits: process.env.NEXT_PUBLIC_ADSENSE_SLOT_REWARDED?.trim(),
  };
  const slot = map[placement];
  return slot && /^\d+$/.test(slot) ? slot : null;
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
 * House/sponsor creatives only when explicitly allowed — never the default
 * path for “get paid” monetization.
 */
export function houseAdsAllowed(): boolean {
  return process.env.NEXT_PUBLIC_CLEAN_SNEAKS_HOUSE_ADS === "1";
}

/** True when Google AdSense publisher id is configured (real paid network). */
export function adsenseConfigured(): boolean {
  return Boolean(adsenseClientId());
}

/** Prefer AdSense whenever the publisher id is set (Auto ads and/or unit slots). */
export function resolveAdNetwork(placement: AdPlacementId): "adsense" | "house" | "unconfigured" {
  if (!adsEnabled()) return "unconfigured";
  if (adsenseClientId()) return "adsense";
  if (houseAdsAllowed()) return "house";
  return "unconfigured";
}

/** Conservative display CPM used only for local earnings estimates. */
export const ESTIMATED_DISPLAY_CPM_USD = 2.4;
/** Higher estimate for completed rewarded views. */
export const ESTIMATED_REWARDED_CPM_USD = 9.5;

export const REWARDED_CREDITS = 75;
export const REWARDED_COOLDOWN_MS = 90_000;
export const INTERSTITIAL_COOLDOWN_MS = 45_000;

/** Direct / house sponsors — opt-in only via NEXT_PUBLIC_CLEAN_SNEAKS_HOUSE_ADS=1. */
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
