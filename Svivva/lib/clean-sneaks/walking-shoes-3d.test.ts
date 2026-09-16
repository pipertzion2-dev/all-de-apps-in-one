import { describe, expect, it } from "vitest";
import { createWalkingShoes3D, updateWalkingShoes3D } from "@/lib/clean-sneaks/walking-shoes-3d";

describe("walking-shoes-3d", () => {
  it("builds a walking pair scaffold with no wheels", () => {
    const shoes = createWalkingShoes3D(null, false, false, "oilSlick");
    // Without a preloaded blueprint, shoe panels are null — pivots still exist.
    expect(shoes.leftPivot).toBeTruthy();
    expect(shoes.rightPivot).toBeTruthy();
    expect(shoes).not.toHaveProperty("wheels");
  });

  it("alternates which foot lifts during the walk cycle", () => {
    const shoes = createWalkingShoes3D(null, false, false, "emerald");

    updateWalkingShoes3D(shoes, {
      walkPhase: 0.25,
      airborne: false,
      dirt: 0,
      freshGlow: true,
      shieldActive: false,
    });
    expect(shoes.leftPivot.position.y).toBeGreaterThan(shoes.rightPivot.position.y);
    expect(shoes.leftPivot.rotation.x).toBeLessThan(shoes.rightPivot.rotation.x);

    updateWalkingShoes3D(shoes, {
      walkPhase: 0.75,
      airborne: false,
      dirt: 0,
      freshGlow: true,
      shieldActive: false,
    });
    expect(shoes.rightPivot.position.y).toBeGreaterThan(shoes.leftPivot.position.y);
    expect(shoes.rightPivot.rotation.x).toBeLessThan(shoes.leftPivot.rotation.x);
  });
});
