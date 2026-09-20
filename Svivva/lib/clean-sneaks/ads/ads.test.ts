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

  it("uses AdSense only when a display slot id is configured", () => {
    // Publisher id alone (site default) is for Auto ads — unit UI stays quiet.
    expect(resolveAdNetwork("menu_banner")).toBe("unconfigured");
    expect(resolveAdNetwork("run_interstitial")).toBe("unconfigured");
  });

  it("uses AdSense when client + slot env are set", () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT", "ca-pub-1234567890123456");
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_SLOT_BANNER", "1234567890");
    expect(resolveAdNetwork("menu_banner")).toBe("adsense");
    // Shared banner slot can fill interstitial when placement-specific is missing.
    expect(resolveAdNetwork("run_interstitial")).toBe("adsense");
  });

  it("falls back to house ads when slots are missing but house is enabled", () => {
    vi.stubEnv("NEXT_PUBLIC_CLEAN_SNEAKS_HOUSE_ADS", "1");
    expect(resolveAdNetwork("menu_banner")).toBe("house");
  });

  it("never ships AdSense setup copy into player-facing ad components", () => {
    const { readFileSync } = require("fs") as typeof import("fs");
    const { resolve } = require("path") as typeof import("path");
    const root = resolve(__dirname, "../../../components/clean-sneaks/ads");
    for (const file of [
      "AdSenseSlot.tsx",
      "GameAdBanner.tsx",
      "GameRewardedAd.tsx",
      "GameInterstitialAd.tsx",
    ]) {
      const src = readFileSync(resolve(root, file), "utf8");
      expect(src).not.toMatch(/NEXT_PUBLIC_ADSENSE_SLOT_BANNER/);
      expect(src).not.toMatch(/Create a Display ad unit/);
      expect(src).not.toMatch(/adsense-missing-slot/);
      expect(src).not.toMatch(/game-ad-banner-setup/);
      expect(src).not.toMatch(/game-rewarded-ad-setup/);
    }
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
