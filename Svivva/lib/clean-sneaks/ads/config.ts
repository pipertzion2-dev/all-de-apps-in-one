import type { AdPlacementId, HouseCreative } from "./types";

/**
 * Wire Google AdSense (or keep house ads until approved).
 *
 * 1. https://www.google.com/adsense/start → create account + site
 * 2. Add NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXX
 * 3. Create display units → set slot ids below
 * 4. Redeploy — live ads replace house sponsors automatically
 */
export function adsenseClientId(): string | null {
  const raw = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || "";
  return raw.startsWith("ca-pub-") ? raw : null;
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

export function adsEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_CLEAN_SNEAKS_ADS === "0") return false;
  return true;
}

/** Prefer AdSense when client + slot exist; otherwise house creatives. */
export function resolveAdNetwork(placement: AdPlacementId): "adsense" | "house" {
  if (!adsEnabled()) return "house";
  if (adsenseClientId() && adsenseSlot(placement)) return "adsense";
  return "house";
}

/** Conservative display CPM used only for local earnings estimates. */
export const ESTIMATED_DISPLAY_CPM_USD = 2.4;
/** Higher estimate for completed rewarded views. */
export const ESTIMATED_REWARDED_CPM_USD = 9.5;

export const REWARDED_CREDITS = 75;
export const REWARDED_COOLDOWN_MS = 90_000;
export const INTERSTITIAL_COOLDOWN_MS = 45_000;

/** Direct / house sponsors shown until AdSense fills (or as fallback). */
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
