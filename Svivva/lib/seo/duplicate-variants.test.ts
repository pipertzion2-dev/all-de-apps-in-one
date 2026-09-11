import { describe, it, expect } from "vitest";
import { isDuplicateSeoVariantSlug, canonicalSlugFromVariant } from "@/lib/seo/duplicate-variants";

describe("duplicate-variants", () => {
  it("flags doorway variant slugs", () => {
    expect(isDuplicateSeoVariantSlug("json-formatter-guide")).toBe(true);
    expect(isDuplicateSeoVariantSlug("free-json-formatter")).toBe(true);
    expect(isDuplicateSeoVariantSlug("best-json-formatter")).toBe(true);
    expect(isDuplicateSeoVariantSlug("json-formatter-alternative")).toBe(true);
    expect(isDuplicateSeoVariantSlug("json-formatter-online")).toBe(true);
  });

  it("allows canonical tool slugs", () => {
    expect(isDuplicateSeoVariantSlug("json-formatter")).toBe(false);
    expect(isDuplicateSeoVariantSlug("event-divvy-preview")).toBe(false);
  });

  it("derives canonical slug from variants", () => {
    expect(canonicalSlugFromVariant("free-json-formatter")).toBe("json-formatter");
    expect(canonicalSlugFromVariant("json-formatter-guide")).toBe("json-formatter");
  });
});
