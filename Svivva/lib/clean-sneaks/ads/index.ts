import { HOUSE_CREATIVES } from "./config";
import type { HouseCreative } from "./types";

export function pickHouseCreative(seed = Date.now()): HouseCreative {
  const list = HOUSE_CREATIVES;
  const idx = Math.abs(Math.floor(seed)) % list.length;
  return list[idx]!;
}

export {
  adsEnabled,
  adsenseClientId,
  adsensePublisherId,
  adsenseSlot,
  adsenseAnySlot,
  adsenseConfigured,
  houseAdsAllowed,
  resolveAdNetwork,
  REWARDED_CREDITS,
  REWARDED_COOLDOWN_MS,
  INTERSTITIAL_COOLDOWN_MS,
  HOUSE_CREATIVES,
  ESTIMATED_DISPLAY_CPM_USD,
  ESTIMATED_REWARDED_CPM_USD,
} from "./config";

export {
  readAdEarnings,
  recordAdEvent,
  markAdCooldown,
  cooldownRemainingMs,
  canShowPlacement,
  rewardedCreditsAmount,
  estimateEventUsd,
  AD_EARNINGS_KEY,
  AD_COOLDOWN_KEY,
} from "./earnings";

export type {
  AdPlacementId,
  AdNetwork,
  AdEventKind,
  AdEarningsSnapshot,
  AdEventRecord,
  HouseCreative,
} from "./types";
