import { describe, expect, it } from "vitest";
import { mergeSchedulerConfig } from "./scheduler-types";

describe("mergeSchedulerConfig", () => {
  it("defaults to enabled scheduler with autopilot", () => {
    const config = mergeSchedulerConfig(null);
    expect(config.enabled).toBe(true);
    expect(config.runAutopilot).toBe(true);
    expect(config.maxProjectsPerRun).toBe(20);
  });

  it("merges project metadata overrides", () => {
    const config = mergeSchedulerConfig({
      scheduler: { enabled: false, maxProjectsPerRun: 5 },
    });
    expect(config.enabled).toBe(false);
    expect(config.maxProjectsPerRun).toBe(5);
    expect(config.runAutopilot).toBe(true);
  });
});
