import { describe, expect, it } from "vitest";
import { ALL_OBSTACLES } from "./constants";
import { ohNoActionsForObstacle, pickOhNoActionForObstacle } from "./contact-map";

describe("Oh No action telegraph", () => {
  it("maps every obstacle to at least one valid save", () => {
    for (const kind of ALL_OBSTACLES) {
      const options = ohNoActionsForObstacle(kind);
      expect(options.length).toBeGreaterThan(0);
      const picked = pickOhNoActionForObstacle(kind);
      expect(options).toContain(picked);
    }
  });

  it("prefers hop for standing water and mud", () => {
    expect(ohNoActionsForObstacle("mud")).toContain("hop");
    expect(ohNoActionsForObstacle("water")).toContain("hop");
    expect(ohNoActionsForObstacle("gum")).toContain("twist");
  });
});
