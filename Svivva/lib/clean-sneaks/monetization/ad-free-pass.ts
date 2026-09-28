/**
 * One-time $5 Cash App — ad-free Klean Sneaks on this device.
 */

import { getCashAppTag } from "@/lib/interim-payments";

export const AD_FREE_PASS_KEY = "zzai.klean.adfree.v1";
export const AD_FREE_CASHAPP_DOLLARS = 5;
export const AD_FREE_PRODUCT_ID = "klean_adfree_lifetime";

export function cashAppAdFreeUrl(tag = getCashAppTag()): string {
  const handle = tag.replace(/^\$/, "");
  const note = encodeURIComponent("Klean-AdFree");
  return `https://cash.app/$${handle}/${AD_FREE_CASHAPP_DOLLARS}?note=${note}`;
}

export function readAdFreePass(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(AD_FREE_PASS_KEY) === "1";
  } catch {
    return false;
  }
}

export function grantAdFreePass(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AD_FREE_PASS_KEY, "1");
  } catch {
    /* ignore */
  }
}
