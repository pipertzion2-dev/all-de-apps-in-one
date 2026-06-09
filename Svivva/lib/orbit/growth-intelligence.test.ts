import { describe, expect, it } from "vitest";
import {
  buildGrowthIntelligenceReport,
  computeOpportunityScore,
  GROWTH_INTEL_MIN_SCORE,
} from "./growth-intelligence";

describe("growth-intelligence", () => {
  it("computes weighted opportunity score", () => {
    const score = computeOpportunityScore({
      frequency: 100,
      commercialIntent: 100,
      growthVelocity: 100,
      lowCompetition: 100,
      contentReusability: 100,
    });
    expect(score).toBe(100);
  });

  it("builds report with only opportunities above threshold", () => {
    const report = buildGrowthIntelligenceReport();
    expect(report.opportunities.length).toBeGreaterThan(0);
    for (const o of report.opportunities) {
      expect(o.score).toBeGreaterThanOrEqual(GROWTH_INTEL_MIN_SCORE);
    }
    expect(report.systemsActive).toHaveLength(8);
    expect(report.priorityQueue.length).toBeGreaterThan(0);
  });
});
