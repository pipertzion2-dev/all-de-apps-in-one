import { describe, expect, it } from "vitest";
import {
  getConnectedFeatures,
  getFeature,
  getFeaturesByBus,
  MASTER_BUS,
  MIXING_BUSES,
  OAAS_FULL_NAME,
  OAAS_NAME,
  SIGNAL_BUS,
  formatPatchRoute,
} from "./feature-graph";
import { suggestFeaturesByKeywords } from "./feature-suggestions";

describe("feature-graph", () => {
  it("exposes OaaS platform constants", () => {
    expect(OAAS_NAME).toBe("OaaS");
    expect(OAAS_FULL_NAME).toContain("Orchestration");
  });

  it("defines mixing-board buses and master", () => {
    expect(MIXING_BUSES.length).toBeGreaterThanOrEqual(6);
    expect(SIGNAL_BUS.label).toBe("Signal Bus");
    expect(MASTER_BUS.outputs.length).toBeGreaterThan(0);
  });

  it("assigns channel labels to features", () => {
    const seeds = getFeature("seeds");
    expect(seeds?.channelLabel).toBe("CH 01");
    expect(seeds?.title).toBe("ZZAI Seeds");
    expect(getConnectedFeatures("seeds").length).toBeGreaterThan(2);
  });

  it("sends Hybrid FX to the Hybrid² lab", () => {
    const hybrid = getFeature("hybridization");
    expect(hybrid?.href).toBe("/dashboard/hybrid-lab");
    expect(hybrid?.description.toLowerCase()).toContain("hybridization²");
  });

  it("groups channels by subgroup bus", () => {
    const seedBus = getFeaturesByBus("seed");
    expect(seedBus.every((f) => f.bus === "seed")).toBe(true);
    expect(seedBus[0]?.id).toBe("seeds");
  });

  it("exposes OaaS as patch bay on hybrid bus", () => {
    const orchestration = getFeature("orchestration");
    expect(orchestration?.title).toBe("Orchestration as a Service");
    expect(orchestration?.channelLabel).toBe("CH 16");
  });

  it("formats patch routes", () => {
    expect(formatPatchRoute(["Seeds", "Launch"])).toBe("Seeds → Launch");
  });
});

describe("feature-suggestions", () => {
  it("routes app portfolio goals to seeds first", () => {
    const result = suggestFeaturesByKeywords({
      goal: "I have a PDF and want multiple SaaS apps with marketing",
    });
    expect(result.suggestions[0]?.featureId).toBe("seeds");
    expect(result.suggestions.some((s) => s.featureId === "launch-studio")).toBe(true);
  });

  it("routes YouTube transcript goals to seeds", () => {
    const result = suggestFeaturesByKeywords({
      goal: "transcribe a youtube video into deployable apps",
    });
    expect(result.suggestions[0]?.featureId).toBe("seeds");
  });

  it("routes blend-the-channels goals to the Hybrid² lab", () => {
    const result = suggestFeaturesByKeywords({
      goal: "blend seeds with play then hybridize those blends",
    });
    expect(result.suggestions[0]?.featureId).toBe("hybridization");
  });

  it("routes patent goals to protection and hybrid", () => {
    const result = suggestFeaturesByKeywords({
      goal: "group patent sketches court ready",
    });
    expect(result.suggestions.some((s) => s.featureId === "poor-man-protection")).toBe(true);
  });
});
