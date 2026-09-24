import { isValidAdsenseSlotId } from "@/lib/adsense-credentials";
import type { AdPlacementId } from "@/lib/clean-sneaks/ads/types";

const PLACEMENT_ENV: Record<AdPlacementId, string> = {
  menu_banner: "NEXT_PUBLIC_ADSENSE_SLOT_BANNER",
  run_interstitial: "NEXT_PUBLIC_ADSENSE_SLOT_INTERSTITIAL",
  rewarded_credits: "NEXT_PUBLIC_ADSENSE_SLOT_REWARDED",
  hub_display: "NEXT_PUBLIC_ADSENSE_SLOT_BANNER",
};

export function readEnvAdsenseSlot(envKey: string): string | null {
  const v = process.env[envKey]?.trim();
  return isValidAdsenseSlotId(v) ? v! : null;
}

/** One display unit id for all placements (Vercel / Orbit banner-only setup). */
export function readDefaultAdsenseSlot(): string | null {
  return (
    readEnvAdsenseSlot("NEXT_PUBLIC_ADSENSE_SLOT") ||
    readEnvAdsenseSlot("NEXT_PUBLIC_ADSENSE_SLOT_BANNER") ||
    readEnvAdsenseSlot("NEXT_PUBLIC_ADSENSE_SLOT_INTERSTITIAL") ||
    readEnvAdsenseSlot("NEXT_PUBLIC_ADSENSE_SLOT_REWARDED") ||
    null
  );
}

export function resolveAdsenseSlotForPlacement(placement: AdPlacementId): string | null {
  const specific = readEnvAdsenseSlot(PLACEMENT_ENV[placement]);
  if (specific) return specific;
  return readDefaultAdsenseSlot();
}

export function anyConfiguredAdsenseSlot(): string | null {
  return (
    resolveAdsenseSlotForPlacement("menu_banner") ||
    resolveAdsenseSlotForPlacement("run_interstitial") ||
    resolveAdsenseSlotForPlacement("rewarded_credits") ||
    resolveAdsenseSlotForPlacement("hub_display") ||
    null
  );
}
