import { describe, expect, it } from "vitest";
import { ACQUISITION_PLAYBOOKS, defaultAcquisitionUtmPresets } from "./customer-acquisition";

describe("customer-acquisition-automation wiring", () => {
  it("has critical playbooks for do-it-all campaign seeding", () => {
    const criticalOrHigh = ACQUISITION_PLAYBOOKS.filter(
      (p) => p.impact === "critical" || p.impact === "high",
    );
    expect(criticalOrHigh.length).toBeGreaterThanOrEqual(5);
    expect(criticalOrHigh.some((p) => p.actions.includes("traffic_blast"))).toBe(true);
  });

  it("UTM presets cover launch channels for automation", () => {
    const presets = defaultAcquisitionUtmPresets("https://zzaizzai.com");
    expect(presets.map((p) => p.utmSource)).toEqual(
      expect.arrayContaining(["producthunt", "reddit", "tools", "referral", "linkedin"]),
    );
  });

  it("exports the automation runner", async () => {
    const mod = await import("./customer-acquisition-automation");
    expect(typeof mod.runCustomerAcquisitionAutomation).toBe("function");
  });
});
