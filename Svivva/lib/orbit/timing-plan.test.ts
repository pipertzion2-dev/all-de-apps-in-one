import { describe, expect, it } from "vitest";
import { nextTimingStep, TIMING_PLAN_STEPS } from "@/lib/orbit/timing-plan";

describe("timing-plan", () => {
  it("has ordered steps starting with GSC foundation", () => {
    expect(TIMING_PLAN_STEPS[0]?.id).toBe("foundation-gsc");
    expect(TIMING_PLAN_STEPS.some((s) => s.id === "index-batch-1")).toBe(true);
  });

  it("returns next incomplete step", () => {
    expect(nextTimingStep([])?.id).toBe("foundation-gsc");
    expect(nextTimingStep(["foundation-gsc"])?.id).toBe("foundation-sitemap");
    expect(nextTimingStep(TIMING_PLAN_STEPS.map((s) => s.id))).toBeNull();
  });
});
