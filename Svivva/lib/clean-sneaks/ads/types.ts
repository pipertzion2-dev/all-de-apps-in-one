/** Placement + creative types for Klean Sneaks advertising. */

export type AdPlacementId = "menu_banner" | "run_interstitial" | "rewarded_credits";

export type AdNetwork = "adsense" | "house";

export type AdEventKind = "impression" | "click" | "reward_granted" | "dismiss" | "fill_fail";

export type HouseCreative = {
  id: string;
  headline: string;
  body: string;
  cta: string;
  href: string;
  accent: string;
};

export type AdEarningsSnapshot = {
  impressions: number;
  clicks: number;
  rewardsGranted: number;
  /** Rough USD estimate from configured CPM / RPC — not Google payout. */
  estimatedUsd: number;
  lastEventAt: number | null;
};

export type AdEventRecord = {
  id: string;
  placement: AdPlacementId;
  kind: AdEventKind;
  network: AdNetwork;
  at: number;
  estimatedUsd: number;
};
