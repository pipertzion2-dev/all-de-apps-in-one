import { describe, expect, it } from "vitest";
import { parseSourcingResult } from "./sourcing";

describe("parseSourcingResult", () => {
  it("parses valid supplier JSON", () => {
    const result = parseSourcingResult(
      JSON.stringify({
        manufacturers: [
          {
            name: "Xometry",
            website: "https://xometry.com",
            specialty: "CNC",
            fit: "Fast prototypes",
            estimatedCost: "$500-$2000",
            moq: "1",
            location: "USA",
            leadTime: "1-2 weeks",
          },
        ],
        materialSuppliers: [
          {
            material: "Aluminum",
            supplier: "McMaster-Carr",
            website: "https://mcmaster.com",
            priceRange: "$5/lb",
          },
        ],
        platforms: [
          {
            name: "Alibaba",
            website: "https://alibaba.com",
            type: "Marketplace",
            description: "Bulk sourcing",
          },
        ],
        recommendation: "Start with Xometry for prototypes.",
      }),
    );
    expect(result.manufacturers).toHaveLength(1);
    expect(result.materialSuppliers[0]?.supplier).toBe("McMaster-Carr");
  });

  it("rejects empty supplier lists", () => {
    expect(() =>
      parseSourcingResult(
        JSON.stringify({
          manufacturers: [],
          materialSuppliers: [],
          platforms: [],
          recommendation: "",
        }),
      ),
    ).toThrow(/No suppliers were returned/);
  });
});
