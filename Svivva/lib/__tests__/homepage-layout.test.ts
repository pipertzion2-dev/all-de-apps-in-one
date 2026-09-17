import { describe, expect, it } from "vitest";
import { HOMEPAGE_SECTIONS, showHomepageSection } from "@/lib/homepage-layout";

describe("homepage-layout", () => {
  it("keeps the homepage compact by default", () => {
    expect(HOMEPAGE_SECTIONS.oaasHub).toBe(false);
    expect(HOMEPAGE_SECTIONS.features).toBe(false);
    expect(HOMEPAGE_SECTIONS.pricing).toBe(false);
    expect(HOMEPAGE_SECTIONS.cleanSneaks).toBe(false);
  });

  it("shows quick links under the cube", () => {
    expect(showHomepageSection("quickLinks")).toBe(true);
  });
});
