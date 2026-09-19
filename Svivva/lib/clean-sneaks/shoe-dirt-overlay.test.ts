import { describe, expect, it } from "vitest";
import { applySubstanceToShoe, createEmptyShoeCondition } from "./dirt-system";
import { dirtIncrementLevel, DIRT_INCREMENT_STEP } from "./shoe-dirt-overlay";

describe("shoe dirt increments", () => {
  it("stays clean below the first splat threshold", () => {
    expect(dirtIncrementLevel(0)).toBe(0);
    expect(dirtIncrementLevel(1)).toBe(0);
  });

  it("steps up in visible increments as zone fill increases", () => {
    expect(dirtIncrementLevel(2)).toBe(1);
    expect(dirtIncrementLevel(DIRT_INCREMENT_STEP)).toBe(2);
    expect(dirtIncrementLevel(DIRT_INCREMENT_STEP * 4)).toBe(5);
    expect(dirtIncrementLevel(100)).toBe(10);
  });

  it("tracks substance-specific stains on zones", () => {
    let shoe = createEmptyShoeCondition();
    const mud = applySubstanceToShoe({
      shoe,
      substance: "mud",
      material: "mesh",
      intensity: 1,
    });
    shoe = mud.shoe;
    expect(shoe.dirt.outsole.amount).toBeGreaterThan(10);
    expect(dirtIncrementLevel(shoe.dirt.outsole.amount)).toBeGreaterThanOrEqual(1);
  });
});
