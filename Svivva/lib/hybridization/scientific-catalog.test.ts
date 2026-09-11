import { describe, expect, it } from "vitest";
import { formatAllDomainBridgesForPrompt, getScientificCatalog } from "./scientific-catalog";
import { matchingDomainBridges } from "./principles";

describe("getScientificCatalog", () => {
  it("returns the full protocol, not just saved blends", () => {
    const catalog = getScientificCatalog();
    expect(catalog.domainBridges.length).toBeGreaterThanOrEqual(4);
    expect(catalog.biomimeticLibrary.length).toBeGreaterThanOrEqual(7);
    expect(catalog.referenceDesigns.length).toBeGreaterThanOrEqual(4);
    expect(catalog.analysisSteps.length).toBe(5);
    expect(catalog.graphInvariants.length).toBeGreaterThanOrEqual(4);
    expect(catalog.hybridizationModes).toContain("emergent");
  });
});

describe("formatAllDomainBridgesForPrompt", () => {
  it("includes every domain bridge for LLM context", () => {
    const text = formatAllDomainBridgesForPrompt();
    expect(text).toContain("fourier-ohm-darcy");
    expect(text).toContain("wave-equation");
    expect(text).toContain("reaction-diffusion");
    expect(text).toContain("information-energy");
  });
});

describe("matchingDomainBridges", () => {
  it("returns all bridges that span both domains", () => {
    const hits = matchingDomainBridges("thermal", "electrical");
    expect(hits.some((b) => b.id === "fourier-ohm-darcy")).toBe(true);
  });

  it("returns empty when no bridge spans both domains directly", () => {
    expect(matchingDomainBridges("acoustic", "digital")).toEqual([]);
  });
});
