import { trackEvent } from "@/lib/analytics";
import {
  ESTIMATED_DISPLAY_CPM_USD,
  ESTIMATED_REWARDED_CPM_USD,
  INTERSTITIAL_COOLDOWN_MS,
  REWARDED_COOLDOWN_MS,
  REWARDED_CREDITS,
} from "./config";
import type {
  AdEarningsSnapshot,
  AdEventKind,
  AdEventRecord,
  AdNetwork,
  AdPlacementId,
} from "./types";

export const AD_EARNINGS_KEY = "zzai.clean-sneaks.adEarnings.v1";
export const AD_COOLDOWN_KEY = "zzai.clean-sneaks.adCooldown.v1";

type CooldownMap = Partial<Record<AdPlacementId, number>>;

function emptyEarnings(): AdEarningsSnapshot {
  return {
    impressions: 0,
    clicks: 0,
    rewardsGranted: 0,
    estimatedUsd: 0,
    lastEventAt: null,
  };
}

export function readAdEarnings(): AdEarningsSnapshot {
  if (typeof window === "undefined") return emptyEarnings();
  try {
    const raw = window.localStorage.getItem(AD_EARNINGS_KEY);
    if (!raw) return emptyEarnings();
    const parsed = JSON.parse(raw) as Partial<AdEarningsSnapshot>;
    return {
      impressions: Math.max(0, Math.floor(Number(parsed.impressions) || 0)),
      clicks: Math.max(0, Math.floor(Number(parsed.clicks) || 0)),
      rewardsGranted: Math.max(0, Math.floor(Number(parsed.rewardsGranted) || 0)),
      estimatedUsd: Math.max(0, Number(parsed.estimatedUsd) || 0),
      lastEventAt: parsed.lastEventAt ? Number(parsed.lastEventAt) : null,
    };
  } catch {
    return emptyEarnings();
  }
}

function writeAdEarnings(next: AdEarningsSnapshot): AdEarningsSnapshot {
  if (typeof window === "undefined") return next;
  try {
    window.localStorage.setItem(AD_EARNINGS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

function readCooldowns(): CooldownMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(AD_COOLDOWN_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CooldownMap;
  } catch {
    return {};
  }
}

function writeCooldowns(next: CooldownMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AD_COOLDOWN_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function estimateEventUsd(placement: AdPlacementId, kind: AdEventKind): number {
  if (kind === "click") return 0.04;
  if (kind === "reward_granted") return ESTIMATED_REWARDED_CPM_USD / 1000;
  if (kind === "impression") {
    const cpm =
      placement === "rewarded_credits" ? ESTIMATED_REWARDED_CPM_USD : ESTIMATED_DISPLAY_CPM_USD;
    return cpm / 1000;
  }
  return 0;
}

export function recordAdEvent(args: {
  placement: AdPlacementId;
  kind: AdEventKind;
  network: AdNetwork;
}): AdEventRecord {
  const estimatedUsd = estimateEventUsd(args.placement, args.kind);
  const prev = readAdEarnings();
  const next: AdEarningsSnapshot = {
    impressions: prev.impressions + (args.kind === "impression" ? 1 : 0),
    clicks: prev.clicks + (args.kind === "click" ? 1 : 0),
    rewardsGranted: prev.rewardsGranted + (args.kind === "reward_granted" ? 1 : 0),
    estimatedUsd: Math.round((prev.estimatedUsd + estimatedUsd) * 10000) / 10000,
    lastEventAt: Date.now(),
  };
  writeAdEarnings(next);

  trackEvent("clean_sneaks_ad", {
    event_category: "revenue",
    placement: args.placement,
    ad_kind: args.kind,
    network: args.network,
    value: estimatedUsd,
    currency: "USD",
  });

  return {
    id: `${args.placement}-${args.kind}-${Date.now()}`,
    placement: args.placement,
    kind: args.kind,
    network: args.network,
    at: Date.now(),
    estimatedUsd,
  };
}

export function markAdCooldown(placement: AdPlacementId, at = Date.now()) {
  const map = readCooldowns();
  map[placement] = at;
  writeCooldowns(map);
}

export function cooldownRemainingMs(placement: AdPlacementId, now = Date.now()): number {
  const last = readCooldowns()[placement] ?? 0;
  const windowMs =
    placement === "rewarded_credits"
      ? REWARDED_COOLDOWN_MS
      : placement === "run_interstitial"
        ? INTERSTITIAL_COOLDOWN_MS
        : 0;
  return Math.max(0, windowMs - (now - last));
}

export function canShowPlacement(placement: AdPlacementId, now = Date.now()): boolean {
  return cooldownRemainingMs(placement, now) <= 0;
}

export function rewardedCreditsAmount(): number {
  return REWARDED_CREDITS;
}
