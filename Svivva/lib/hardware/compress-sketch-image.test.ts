import { describe, expect, it } from "vitest";
import { SKETCH_IMAGE_MAX_EDGE, computeScaledDimensions } from "./compress-sketch-image";

describe("compress-sketch-image helpers", () => {
  it("keeps small images at original size", () => {
    expect(computeScaledDimensions(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it("downscales images whose longest edge exceeds the cap", () => {
    const out = computeScaledDimensions(4032, 3024, SKETCH_IMAGE_MAX_EDGE);
    expect(Math.max(out.width, out.height)).toBe(SKETCH_IMAGE_MAX_EDGE);
    expect(out.width).toBeGreaterThan(0);
    expect(out.height).toBeGreaterThan(0);
  });

  it("handles portrait orientation", () => {
    const out = computeScaledDimensions(3024, 4032, SKETCH_IMAGE_MAX_EDGE);
    expect(out.height).toBe(SKETCH_IMAGE_MAX_EDGE);
    expect(out.width).toBeLessThan(SKETCH_IMAGE_MAX_EDGE);
  });
});
