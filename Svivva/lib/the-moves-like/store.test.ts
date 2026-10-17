import { describe, expect, it } from "vitest";
import { createEmptyMovement } from "./store";
import { SAMPLE_MOVEMENTS } from "./sample-data";
import { MOVE_CATEGORIES } from "./types";

describe("the-moves-like domain", () => {
  it("seeds sample movements labeled as sample", () => {
    expect(SAMPLE_MOVEMENTS.every((m) => m.source === "sample")).toBe(true);
    expect(SAMPLE_MOVEMENTS.length).toBeGreaterThan(0);
  });

  it("creates user movements with required fields", () => {
    const m = createEmptyMovement({ name: "Windmill prep", category: "power" });
    expect(m.source).toBe("user");
    expect(m.name).toBe("Windmill prep");
    expect(m.category).toBe("power");
    expect(m.id).toMatch(/^move_/);
  });

  it("exposes breakdance categories", () => {
    expect(MOVE_CATEGORIES.map((c) => c.id)).toContain("footwork");
    expect(MOVE_CATEGORIES.map((c) => c.id)).toContain("freezes");
  });
});
