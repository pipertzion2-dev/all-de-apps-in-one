import { describe, expect, it } from "vitest";
import {
  ACQUISITION_PLAYBOOKS,
  ACQUISITION_QUICK_ACTIONS,
  CUSTOMER_ACQUISITION_VERSION,
  acquisitionChannelLabel,
  defaultAcquisitionUtmPresets,
  formatAcquisitionPlaybookMarkdown,
  getAcquisitionPlaybook,
  hybridStrategiesForAcquisition,
  playbooksByImpact,
} from "./customer-acquisition";

describe("customer-acquisition", () => {
  it("ships a versioned playbook catalog covering core channels", () => {
    expect(CUSTOMER_ACQUISITION_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(ACQUISITION_PLAYBOOKS.length).toBeGreaterThanOrEqual(8);
    const channels = new Set(ACQUISITION_PLAYBOOKS.map((p) => p.channel));
    expect(channels.has("organic_seo")).toBe(true);
    expect(channels.has("referral")).toBe(true);
    expect(channels.has("aeo_geo")).toBe(true);
    expect(channels.has("free_tools")).toBe(true);
  });

  it("resolves playbooks and impact filters", () => {
    expect(getAcquisitionPlaybook("organic-compound")?.impact).toBe("critical");
    expect(playbooksByImpact("critical").length).toBeGreaterThan(0);
    expect(acquisitionChannelLabel("plg")).toBe("PLG");
  });

  it("exposes runnable quick actions for Orbit", () => {
    const runnable = ACQUISITION_QUICK_ACTIONS.filter((a) => a.runnable);
    expect(runnable.map((a) => a.id)).toEqual(
      expect.arrayContaining([
        "traffic_blast",
        "weekly_growth",
        "create_utm",
        "create_referral",
        "amplify",
      ]),
    );
  });

  it("builds UTM presets against the site URL", () => {
    const presets = defaultAcquisitionUtmPresets("https://zzaizzai.com");
    expect(presets.length).toBeGreaterThanOrEqual(4);
    expect(presets.every((p) => p.destinationUrl.includes("zzaizzai.com"))).toBe(true);
    expect(presets.some((p) => p.utmSource === "producthunt")).toBe(true);
  });

  it("includes hybrid GTM strategies and markdown export", () => {
    const hybrid = hybridStrategiesForAcquisition();
    expect(hybrid.some((h) => h.id === "hybrid-pls")).toBe(true);
    const md = formatAcquisitionPlaybookMarkdown();
    expect(md).toContain("Organic compound engine");
    expect(md).toContain("Referral / viral loop");
  });
});
