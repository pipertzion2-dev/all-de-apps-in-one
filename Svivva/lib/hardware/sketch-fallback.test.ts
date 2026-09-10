import { describe, expect, it } from "vitest";
import { buildSketchAnalysisFallback } from "./sketch-fallback";

describe("buildSketchAnalysisFallback", () => {
  it("infers wearable category from watch notes", () => {
    const result = buildSketchAnalysisFallback("Digital watch with sapphire bezel");
    expect(result.productCategory).toMatch(/Wearable/i);
    expect(result.productName).toContain("Digital watch");
    expect(result.materials.length).toBeGreaterThan(0);
  });

  it("returns generic concept when notes are empty", () => {
    const result = buildSketchAnalysisFallback("");
    expect(result.productName).toBe("Hardware Concept");
    expect(result.sketchNotes).toContain("Heuristic pre-fill");
  });
});
