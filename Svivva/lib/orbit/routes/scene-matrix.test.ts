import { describe, expect, it } from "vitest";
import { OAAS_GROWTH_MATRIX, getSceneMatrix, resolveSceneTemplate } from "./scene-matrix";

describe("OAAS_GROWTH_MATRIX", () => {
  it("includes IFM, compound, hybrid AEO, and growth scenes", () => {
    expect(getSceneMatrix(OAAS_GROWTH_MATRIX.id)).toBeDefined();
    const ids = OAAS_GROWTH_MATRIX.scenes.map((s) => s.id);
    expect(ids).toContain("ifm");
    expect(ids).toContain("ifm_compound");
    expect(ids).toContain("aeo");
    expect(ids).toContain("growth");
  });

  it("resolves templates for each scene", () => {
    for (const entry of OAAS_GROWTH_MATRIX.scenes) {
      const template = resolveSceneTemplate(entry);
      expect(template?.destinations.length).toBeGreaterThan(0);
    }
  });
});
