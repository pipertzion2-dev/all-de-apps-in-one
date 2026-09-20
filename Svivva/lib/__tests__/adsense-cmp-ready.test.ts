import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("AdSense Google CMP readiness", () => {
  it("allows Funding Choices scripts in CSP", () => {
    const headers = readFileSync(resolve(__dirname, "../security-headers.mjs"), "utf8");
    expect(headers).toContain("fundingchoicesmessages.google.com");
    // ADSENSE_SCRIPT string (used in script-src) must include Funding Choices host
    const scriptConst = headers.match(/const ADSENSE_SCRIPT\s*=\s*\n?\s*"([^"]+)"/);
    expect(scriptConst?.[1]).toContain("fundingchoicesmessages.google.com");
  });

  it("sets Consent Mode v2 defaults before AdSense in root layout", () => {
    const layout = readFileSync(resolve(__dirname, "../../app/layout.tsx"), "utf8");
    expect(layout).toContain("google-consent-mode-defaults");
    expect(layout).toContain("gtag('consent','default'");
    expect(layout).toContain("ad_storage:'denied'");
    const consentIdx = layout.indexOf("google-consent-mode-defaults");
    const adsenseIdx = layout.indexOf("adsbygoogle.js?client=");
    expect(consentIdx).toBeGreaterThan(-1);
    expect(adsenseIdx).toBeGreaterThan(-1);
    expect(consentIdx).toBeLessThan(adsenseIdx);
  });

  it("Orbit links to AdSense Privacy & messaging for Three-Choice CMP", () => {
    const ui = readFileSync(resolve(__dirname, "../../components/orbit-adsense-setup.tsx"), "utf8");
    expect(ui).toContain("privacymessaging");
    expect(ui).toContain("Three-Choice");
    expect(ui).toContain("orbit-adsense-cmp-link");
    expect(ui).toContain("orbit-adsense-cmp-cta");
    expect(ui).toContain("orbit-open-adsense-cmp");
    expect(ui).toContain("https://zzaizzai.com/privacy");
    expect(ui).toContain("https://zzaizzai.com/zzai-logo.png");
    expect(ui).toContain("orbit-adsense-fix-urls");
  });

  it("Orbit continues with Display ad unit creation when banner slot is missing", () => {
    const ui = readFileSync(resolve(__dirname, "../../components/orbit-adsense-setup.tsx"), "utf8");
    expect(ui).toContain("orbit-adsense-display-unit-cta");
    expect(ui).toContain("orbit-open-adsense-ad-units");
    expect(ui).toContain("myads/units");
    expect(ui).toContain("SITE_ADSENSE_SLOT_BANNER");
  });

  it("ships ZZAI ADS Display slot 9914022148 as the site banner default", () => {
    const creds = readFileSync(resolve(__dirname, "../adsense-credentials.ts"), "utf8");
    expect(creds).toContain('SITE_ADSENSE_SLOT_BANNER = "9914022148"');
    const layout = readFileSync(resolve(__dirname, "../../app/layout.tsx"), "utf8");
    expect(layout).toContain("resolveSiteAdsenseSlotBanner");
  });

  it("skips empty Google Advertisement interstitial until a Display slot exists", () => {
    const interstitial = readFileSync(
      resolve(__dirname, "../../components/clean-sneaks/ads/GameInterstitialAd.tsx"),
      "utf8",
    );
    expect(interstitial).toContain("adsenseUnitReady");
    expect(interstitial).toContain('network === "adsense" && !unitReady');
  });
});
