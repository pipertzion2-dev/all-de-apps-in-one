import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AD_COOLDOWN_KEY,
  AD_EARNINGS_KEY,
  canShowPlacement,
  estimateEventUsd,
  markAdCooldown,
  readAdEarnings,
  recordAdEvent,
  resolveAdNetwork,
  rewardedCreditsAmount,
} from "@/lib/clean-sneaks/ads";

function installMemoryStorage() {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
  };
  (globalThis as unknown as { window: { localStorage: typeof localStorage } }).window = {
    localStorage,
  };
  return store;
}

describe("clean-sneaks advertising", () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("falls back to house network without AdSense env", () => {
    expect(resolveAdNetwork("menu_banner")).toBe("house");
  });

  it("records impressions into a local earnings estimate", () => {
    recordAdEvent({
      placement: "menu_banner",
      kind: "impression",
      network: "house",
    });
    const snap = readAdEarnings();
    expect(snap.impressions).toBe(1);
    expect(snap.estimatedUsd).toBeGreaterThan(0);
    expect(snap.estimatedUsd).toBe(estimateEventUsd("menu_banner", "impression"));
    expect(window.localStorage.getItem(AD_EARNINGS_KEY)).toBeTruthy();
  });

  it("enforces rewarded cooldown after a grant window starts", () => {
    expect(canShowPlacement("rewarded_credits")).toBe(true);
    markAdCooldown("rewarded_credits");
    expect(canShowPlacement("rewarded_credits")).toBe(false);
    expect(window.localStorage.getItem(AD_COOLDOWN_KEY)).toBeTruthy();
  });

  it("pays a fixed soft-currency reward for watching ads", () => {
    expect(rewardedCreditsAmount()).toBeGreaterThanOrEqual(50);
  });
});
