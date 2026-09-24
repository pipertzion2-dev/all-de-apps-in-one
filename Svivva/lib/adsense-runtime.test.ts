import { describe, expect, it, vi } from "vitest";
import { SITE_ADSENSE_CLIENT } from "@/lib/adsense-credentials";
import { adsenseRuntimeInlineScript, getAdsenseRuntimeConfig } from "@/lib/adsense-runtime";

vi.mock("@/lib/platform-runtime-secrets", () => ({
  hydratePlatformSecrets: vi.fn(async () => {}),
}));

describe("adsense runtime", () => {
  it("falls back to site publisher client when env is empty", async () => {
    const prev = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
    delete process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
    const config = await getAdsenseRuntimeConfig({ hydrate: false });
    expect(config.client).toBe(SITE_ADSENSE_CLIENT);
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT = prev;
  });

  it("builds inline window config for slots", () => {
    const js = adsenseRuntimeInlineScript({
      client: SITE_ADSENSE_CLIENT,
      slotBanner: "1234567890",
      slotInterstitial: null,
      slotRewarded: null,
    });
    expect(js).toContain("__ADSENSE_CLIENT__");
    expect(js).toContain("__ADSENSE_SLOT_BANNER__");
    expect(js).not.toContain("INTERSTITIAL");
  });
});
