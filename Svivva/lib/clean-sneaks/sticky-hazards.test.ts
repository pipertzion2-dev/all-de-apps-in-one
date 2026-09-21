import { describe, expect, it } from "vitest";
import {
  buildStickyHazard3D,
  isStickyHazardKind,
  pruneStickyAttachments,
  strongestStickyMul,
  STICKY_HAZARD_KINDS,
  STICKY_SPEED_MUL,
  STICKY_STUCK_MS,
} from "./sticky-hazards";

describe("sticky hazards", () => {
  it("recognizes dirt, poop, banana, and gum", () => {
    expect(STICKY_HAZARD_KINDS).toEqual(["dirt", "poop", "banana", "gum"]);
    expect(isStickyHazardKind("gum")).toBe(true);
    expect(isStickyHazardKind("mud")).toBe(false);
  });

  it("builds a Three.js group for each sticky kind", () => {
    for (const kind of STICKY_HAZARD_KINDS) {
      const g = buildStickyHazard3D(kind);
      expect(g.children.length).toBeGreaterThan(0);
      expect(g.userData.stickyKind).toBe(kind);
      expect(g.children.some((c) => c.userData.floorMarker)).toBe(true);
    }
  });

  it("floor hazards are larger than cling-ons", async () => {
    const { buildStickyFloorHazard3D, buildStickyCling3D, STICKY_FLOOR_SCALE } =
      await import("./sticky-hazards");
    expect(STICKY_FLOOR_SCALE.gum).toBeGreaterThan(2);
    const floor = buildStickyFloorHazard3D("banana");
    const cling = buildStickyCling3D("banana");
    expect(floor.children.length).toBeGreaterThan(cling.children.length);
  });

  it("slows the runner while attachments are active", () => {
    const now = 1000;
    const mul = strongestStickyMul(
      [
        { id: 1, kind: "gum", shoe: "left", until: 2000 },
        { id: 2, kind: "dirt", shoe: "right", until: 1500 },
      ],
      now,
    );
    expect(mul).toBe(STICKY_SPEED_MUL.gum);
    expect(STICKY_STUCK_MS.banana).toBeGreaterThan(1000);
  });

  it("prunes expired cling-ons", () => {
    expect(
      pruneStickyAttachments(
        [
          { id: 1, kind: "poop", shoe: "left", until: 500 },
          { id: 2, kind: "banana", shoe: "right", until: 2000 },
        ],
        1000,
      ),
    ).toEqual([{ id: 2, kind: "banana", shoe: "right", until: 2000 }]);
  });
});
