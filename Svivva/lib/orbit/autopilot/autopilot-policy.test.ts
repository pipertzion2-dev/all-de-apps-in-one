import { describe, expect, it } from "vitest";
import { canAutoApplyRecommendation } from "./autopilot-policy";

describe("canAutoApplyRecommendation", () => {
  it("blocks manual-only kinds", () => {
    expect(
      canAutoApplyRecommendation({
        kind: "manual_publish_review",
        campaignMode: "autonomous",
      }).ok,
    ).toBe(false);
    expect(
      canAutoApplyRecommendation({
        kind: "replan_campaign",
        campaignMode: "autonomous",
      }).ok,
    ).toBe(false);
  });

  it("allows index recheck in assisted mode", () => {
    expect(
      canAutoApplyRecommendation({
        kind: "index_recheck",
        campaignMode: "assisted",
        priority: "high",
      }).ok,
    ).toBe(true);
  });

  it("blocks run_distribution in assisted mode", () => {
    const gate = canAutoApplyRecommendation({
      kind: "run_distribution",
      campaignMode: "assisted",
      priority: "medium",
    });
    expect(gate.ok).toBe(false);
    expect(gate.reason).toContain("assisted");
  });

  it("allows run_distribution in autonomous mode", () => {
    expect(
      canAutoApplyRecommendation({
        kind: "run_distribution",
        campaignMode: "autonomous",
        priority: "medium",
      }).ok,
    ).toBe(true);
  });

  it("blocks low-priority items in assisted mode", () => {
    expect(
      canAutoApplyRecommendation({
        kind: "index_recheck",
        campaignMode: "assisted",
        priority: "low",
      }).ok,
    ).toBe(false);
  });

  it("respects quiet hours", () => {
    const noon = new Date("2026-08-18T12:00:00Z");
    expect(
      canAutoApplyRecommendation({
        kind: "index_recheck",
        campaignMode: "autonomous",
        approvalPolicy: { quietHoursStart: "11:00", quietHoursEnd: "13:00" },
        now: noon,
      }).ok,
    ).toBe(false);
  });
});
