import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { buildObstacle3D, buildStreetLitterPiece3D } from "@/lib/clean-sneaks/run-obstacles-3d";
import { ALL_OBSTACLES } from "@/lib/clean-sneaks/constants";

describe("clean-sneaks 3D street garbage", () => {
  it("builds volumetric litter pieces (not flat planes)", () => {
    for (let kind = 0; kind < 5; kind++) {
      const piece = buildStreetLitterPiece3D(kind, kind * 11);
      let meshCount = 0;
      let hasFlatOnlyPlane = true;
      piece.traverse((c) => {
        if ((c as { isMesh?: boolean }).isMesh) {
          meshCount += 1;
          const geo = (c as { geometry?: { type?: string } }).geometry;
          if (geo?.type && geo.type !== "PlaneGeometry") hasFlatOnlyPlane = false;
        }
      });
      expect(meshCount).toBeGreaterThan(0);
      expect(hasFlatOnlyPlane).toBe(false);
    }
  });

  it("never falls back to a bare obstacle cube for street trash kinds", () => {
    for (const kind of ["trash", "bag", "debris", "drink", "street", "grass"] as const) {
      const root = buildObstacle3D(kind);
      let boxOnly = true;
      let meshes = 0;
      root.traverse((c) => {
        if ((c as { isMesh?: boolean }).isMesh) {
          meshes += 1;
          const geo = (c as { geometry?: { type?: string } }).geometry;
          if (geo?.type && geo.type !== "BoxGeometry") boxOnly = false;
        }
      });
      expect(meshes).toBeGreaterThan(0);
      expect(boxOnly).toBe(false);
    }
  });

  it("builds every obstacle kind without throwing", () => {
    for (const kind of ALL_OBSTACLES) {
      expect(() => buildObstacle3D(kind)).not.toThrow();
    }
  });

  it("GroundLitter uses buildStreetLitterPiece3D", () => {
    const src = readFileSync(
      resolve(__dirname, "../../components/clean-sneaks/CleanSneaksRunScene.tsx"),
      "utf8",
    );
    expect(src).toContain("buildStreetLitterPiece3D");
    expect(src).not.toMatch(/ground-litter[\s\S]{0,400}planeGeometry/);
  });
});
