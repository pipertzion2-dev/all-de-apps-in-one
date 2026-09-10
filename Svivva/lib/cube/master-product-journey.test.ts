import { describe, expect, it } from "vitest";
import {
  CUBE_GEOMETRY_FACE_ORDER,
  MASTER_BUS_JOURNEY_ORDER,
  buildMasterProductJourney,
  cubeFaceAtGeometryIndex,
  listCubeFaces,
  masterProductWalkthroughHrefs,
} from "./cube-faces";
import {
  DEFAULT_MASTER_PRODUCT_JOURNEY,
  exportWalkthroughJson,
  exportWalkthroughMarkdown,
  walkAllCubeFacesForProduct,
} from "./master-product-walkthrough";
import { FEATURE_PUBLIC_PATHS } from "@/lib/feature-routes";

describe("cube faces", () => {
  it("lists all six geometry faces", () => {
    const faces = listCubeFaces();
    expect(faces).toHaveLength(6);
    expect(faces.map((f) => f.id).sort()).toEqual(
      ["api", "hardware", "orbit", "play", "seeds", "security"].sort(),
    );
  });

  it("maps geometry index to face for raycast parity", () => {
    expect(cubeFaceAtGeometryIndex(0)?.id).toBe("api");
    expect(cubeFaceAtGeometryIndex(5)?.id).toBe("orbit");
  });

  it("uses the same order as the 3D cube canvas", () => {
    expect([...CUBE_GEOMETRY_FACE_ORDER]).toEqual([
      "api",
      "security",
      "play",
      "hardware",
      "seeds",
      "orbit",
    ]);
  });
});

describe("master product journey", () => {
  it("walks one product through all six cube sides", () => {
    const journey = buildMasterProductJourney({ productName: "Test Widget" });
    expect(journey.steps).toHaveLength(6);
    expect(new Set(journey.steps.map((s) => s.faceId)).size).toBe(6);
    expect(journey.steps.map((s) => s.step)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("covers every public cube route exactly once", () => {
    const hrefs = masterProductWalkthroughHrefs(DEFAULT_MASTER_PRODUCT_JOURNEY);
    expect(hrefs.sort()).toEqual(Object.values(FEATURE_PUBLIC_PATHS).sort());
  });

  it("follows master-bus order Seeds → API → Hardware → Play → Orbit → Protect", () => {
    expect([...MASTER_BUS_JOURNEY_ORDER]).toEqual([
      "seeds",
      "api",
      "hardware",
      "play",
      "orbit",
      "security",
    ]);
  });

  it("exports JSON and markdown for the default product", () => {
    const json = exportWalkthroughJson();
    const parsed = JSON.parse(json) as { steps: unknown[] };
    expect(parsed.steps).toHaveLength(6);

    const md = exportWalkthroughMarkdown();
    expect(md).toContain("Smart Soil Monitor");
    expect(md).toContain("/seeds");
    expect(md).toContain("/dashboard/hardware-builder");
  });

  it("iterates all faces via walkAllCubeFacesForProduct", () => {
    const visited: string[] = [];
    walkAllCubeFacesForProduct((step) => visited.push(step.faceId));
    expect(visited).toHaveLength(6);
    expect(new Set(visited).size).toBe(6);
  });
});
