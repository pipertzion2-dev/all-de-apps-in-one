import { describe, expect, it } from "vitest";
import {
  getConnectedFeatures,
  getFeature,
  HAAS_FULL_NAME,
  HAAS_NAME,
} from "./feature-graph";
import { suggestFeaturesByKeywords } from "./feature-suggestions";

describe("feature-graph", () => {
  it("exposes HaaS platform constants", () => {
    expect(HAAS_NAME).toBe("HaaS");
    expect(HAAS_FULL_NAME).toContain("Hybridization");
  });

  it("exposes ZZAI Seeds as seed-layer module", () => {
    const seeds = getFeature("seeds");
    expect(seeds?.title).toBe("ZZAI Seeds");
    expect(getConnectedFeatures("seeds").length).toBeGreaterThan(2);
  });

  it("exposes HaaS as platform hub", () => {
    const haas = getFeature("haas");
    expect(haas?.title).toBe("Hybridization as a Service");
    expect(haas?.shortTitle).toBe("HaaS");
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

  it("routes patent goals to protection and hybrid", () => {
    const result = suggestFeaturesByKeywords({
      goal: "group patent sketches court ready",
    });
    expect(result.suggestions.some((s) => s.featureId === "poor-man-protection")).toBe(true);
  });
});
