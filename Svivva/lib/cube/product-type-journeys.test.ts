import { describe, expect, it } from "vitest";
import {
  buildProductTypeJourney,
  getProductTypeTemplate,
  resolveProductTypeFaceOrder,
} from "./product-type-journeys";

describe("product type journeys", () => {
  it("finds the fashion template", () => {
    const fashion = getProductTypeTemplate("fashion");
    expect(fashion?.label).toBe("Fashion & apparel");
    expect(fashion?.faceOrder).toEqual(["security", "hardware"]);
  });

  it("builds fashion path with optional digital when smart", () => {
    const fashion = getProductTypeTemplate("fashion")!;
    const base = resolveProductTypeFaceOrder(fashion);
    expect(base).toEqual(["security", "hardware"]);

    const withDigital = resolveProductTypeFaceOrder(fashion, ["api"]);
    expect(withDigital).toEqual(["security", "hardware", "api"]);
  });

  it("builds a journey for fashion with patent → hardware → digital", () => {
    const journey = buildProductTypeJourney(getProductTypeTemplate("fashion")!, {
      productName: "LED trench coat",
      enabledOptionalFaceIds: ["api"],
    });
    expect(journey.steps.map((s) => s.faceId)).toEqual(["security", "hardware", "api"]);
    expect(journey.steps[0]?.shortLabel).toBe("Protect");
    expect(journey.steps[1]?.shortLabel).toBe("Hardware");
    expect(journey.steps[2]?.shortLabel).toBe("Digital");
  });

  it("builds IoT combo without requiring all six faces", () => {
    const journey = buildProductTypeJourney(getProductTypeTemplate("iot")!);
    expect(journey.steps).toHaveLength(5);
    expect(journey.steps[0]?.faceId).toBe("seeds");
  });
});
