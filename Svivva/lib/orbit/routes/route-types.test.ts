import { describe, expect, it } from "vitest";
import { sortDestinations, validateRouteDestinations } from "./route-types";
import { GROWTH_PIPELINE_DESTINATIONS, getRouteTemplate } from "./route-templates";

describe("validateRouteDestinations", () => {
  it("rejects empty destinations", () => {
    expect(validateRouteDestinations([])).toEqual({
      ok: false,
      error: "At least one destination is required",
    });
  });

  it("rejects duplicate orders", () => {
    const result = validateRouteDestinations([
      { channel: "plan", order: 1 },
      { channel: "generate", order: 1 },
    ]);
    expect(result.ok).toBe(false);
  });

  it("accepts valid growth pipeline", () => {
    expect(validateRouteDestinations(GROWTH_PIPELINE_DESTINATIONS).ok).toBe(true);
    expect(GROWTH_PIPELINE_DESTINATIONS.length).toBe(7);
  });
});

describe("sortDestinations", () => {
  it("sorts by order ascending", () => {
    const sorted = sortDestinations([
      { channel: "analytics", order: 5 },
      { channel: "plan", order: 1 },
      { channel: "generate", order: 2 },
    ]);
    expect(sorted.map((d) => d.order)).toEqual([1, 2, 5]);
  });
});

describe("route templates", () => {
  it("includes growth pipeline template", () => {
    const template = getRouteTemplate("growth_pipeline");
    expect(template?.destinations.length).toBe(7);
    expect(template?.destinations.some((d) => d.channel === "approval")).toBe(true);
    expect(template?.destinations.some((d) => d.channel === "seo_ops_gate")).toBe(true);
  });
});
