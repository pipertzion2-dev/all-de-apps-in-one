import { describe, expect, it } from "vitest";
import { buildSourcingFallback } from "./sourcing-fallback";

describe("buildSourcingFallback", () => {
  it("returns jewelry-oriented manufacturers for watch products", () => {
    const result = buildSourcingFallback({
      productName: "Luxury Digital Watch",
      productDescription: "Premium wearable",
      category: "Wearable / Jewelry",
      materials: ["Sapphire", "Steel"],
      manufacturingMethod: "CNC Machining",
      budgetRange: 15000,
    });
    expect(result.manufacturers.length).toBeGreaterThanOrEqual(3);
    expect(result.materialSuppliers.length).toBeGreaterThan(0);
    expect(result.platforms.length).toBeGreaterThanOrEqual(2);
  });
});
