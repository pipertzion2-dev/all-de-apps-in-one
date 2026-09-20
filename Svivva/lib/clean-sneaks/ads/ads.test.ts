import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
    vi.unstubAllEnvs();
  });

  it("uses site AdSense publisher by default (verification + Auto ads)", () => {
    expect(resolveAdNetwork("menu_banner")).toBe("adsense");
  });

  it("uses AdSense when NEXT_PUBLIC_ADSENSE_CLIENT is set", () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT", "ca-pub-1234567890123456");
    expect(resolveAdNetwork("menu_banner")).toBe("adsense");
    expect(resolveAdNetwork("run_interstitial")).toBe("adsense");
  });

  it("requires a Display slot id before in-game AdSense units are ready", async () => {
    const { adsenseUnitReady } = await import("@/lib/clean-sneaks/ads/config");
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT", "ca-pub-1234567890123456");
    expect(adsenseUnitReady("menu_banner")).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_SLOT_BANNER", "1234567890");
    expect(adsenseUnitReady("menu_banner")).toBe(true);
    expect(adsenseUnitReady("run_interstitial")).toBe(true);
  });

  it("records impressions into a local earnings estimate", () => {
    recordAdEvent({
      placement: "menu_banner",
      kind: "impression",
      network: "adsense",
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
