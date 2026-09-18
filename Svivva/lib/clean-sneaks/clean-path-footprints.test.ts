import { describe, expect, it } from "vitest";
import {
  createCleanPathFootprintPool,
  disposeCleanPathFootprintPool,
  syncCleanPathFootprints,
} from "./clean-path-footprints";
import type { CleanPathOption } from "./sneak-vision";

const samplePaths: CleanPathOption[] = [
  { kind: "safe", label: "Safe", lane: 1, predictedClean: 90, blurb: "clean" },
  { kind: "fast", label: "Fast", lane: 0, predictedClean: 70, blurb: "quick" },
];

describe("clean path footprints", () => {
  it("reuses the same meshes across many sync frames (no per-frame alloc)", () => {
    const pool = createCleanPathFootprintPool();
    const before = pool.meshes.slice();
    const childCount = pool.group.children.length;

    for (let i = 0; i < 120; i++) {
      syncCleanPathFootprints(pool, samplePaths, 1000 + i * 16, 5000);
    }

    expect(pool.meshes).toEqual(before);
    expect(pool.group.children.length).toBe(childCount);
    expect(pool.meshes.filter((m) => m.visible).length).toBe(10);

    syncCleanPathFootprints(pool, null, 6000, 5000);
    expect(pool.meshes.every((m) => !m.visible)).toBe(true);

    disposeCleanPathFootprintPool(pool);
  });

  it("does not grow the group when paths stay active", () => {
    const pool = createCleanPathFootprintPool();
    syncCleanPathFootprints(pool, samplePaths, 0, 10_000);
    const n = pool.group.children.length;
    for (let i = 0; i < 60; i++) {
      syncCleanPathFootprints(pool, samplePaths, i * 16, 10_000);
    }
    expect(pool.group.children.length).toBe(n);
    disposeCleanPathFootprintPool(pool);
  });
});
