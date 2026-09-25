import { describe, expect, it } from "vitest";
import {
  nextTimingStep,
  TIMING_PLAN_STEPS,
  TIMING_PLAN_VERSION,
  isTimingPlanComplete,
} from "@/lib/orbit/timing-plan";
import { profileForTimingStep } from "@/lib/orbit/timing-cadence";

describe("timing-plan", () => {
  it("uses professional plan v2 with crawl settle before indexing", () => {
    expect(TIMING_PLAN_VERSION).toBe(2);
    expect(TIMING_PLAN_STEPS[0]?.id).toBe("foundation-gsc");
    expect(TIMING_PLAN_STEPS.some((s) => s.id === "crawl-settle")).toBe(true);
    const batch1 = TIMING_PLAN_STEPS.find((s) => s.id === "index-batch-1");
    expect(batch1?.minHoursAfterPrevious).toBeGreaterThanOrEqual(48);
  });

  it("returns next incomplete step", () => {
    expect(nextTimingStep([])?.id).toBe("foundation-gsc");
    expect(nextTimingStep(["foundation-gsc"])?.id).toBe("foundation-sitemap");
    expect(nextTimingStep(TIMING_PLAN_STEPS.map((s) => s.id))).toBeNull();
    expect(isTimingPlanComplete(TIMING_PLAN_STEPS.map((s) => s.id))).toBe(true);
  });

  it("uses conservative indexing profiles per step", () => {
    const first = profileForTimingStep("index-batch-1");
    expect(first?.skipIndexingApi).toBe(true);
    expect(first?.indexNowMaxUrls).toBe(45);
    const second = profileForTimingStep("index-batch-2");
    expect(second?.indexingApiMaxUrls).toBe(35);
    expect(second?.skipGoogleSitemap).toBe(true);
  });
});
