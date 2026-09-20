import { describe, expect, it } from "vitest";
import { isNonIndexableSlug } from "@/lib/seo/legacy-paths";

describe("isNonIndexableSlug", () => {
  it("excludes root slugs that duplicate native /tools URLs", () => {
    expect(isNonIndexableSlug("ai-api-cost-calculator")).toBe(true);
    expect(isNonIndexableSlug("json-schema-validator")).toBe(true);
    expect(isNonIndexableSlug("random-seo-only-page")).toBe(false);
  });
});
