import { describe, expect, it } from "vitest";
import { matchManufacturingMethod, normalizeToOptions } from "./sketch-analysis";

describe("sketch-analysis helpers", () => {
  it("maps extracted materials to known options", () => {
    const out = normalizeToOptions(
      ["aluminum", "plastic (abs)"],
      ["Aluminum", "Plastic (ABS)", "Steel"],
    );
    expect(out).toContain("Aluminum");
    expect(out).toContain("Plastic (ABS)");
  });

  it("picks closest manufacturing method", () => {
    expect(
      matchManufacturingMethod("cnc", ["3D Printing", "CNC Machining", "Injection Molding"]),
    ).toBe("CNC Machining");
  });
});
