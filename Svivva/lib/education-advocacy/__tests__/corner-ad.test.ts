import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("EducationAdvocacyCornerAd", () => {
  it("is not mounted site-wide from Providers (homepage UI revert)", () => {
    const providers = readFileSync(resolve(__dirname, "../../../components/providers.tsx"), "utf8");
    expect(providers).not.toContain("EducationAdvocacyCornerAd");
  });

  it("still invites new situations and helpers into the advocate console", () => {
    const src = readFileSync(
      resolve(__dirname, "../../../components/education-advocacy/corner-ad.tsx"),
      "utf8",
    );
    expect(src).toContain("/dashboard/education-advocacy");
    expect(src).toMatch(/education advocacy/i);
    expect(src).toMatch(/backdrop-blur/i);
    expect(src).toMatch(/homepageIntroDone|homepage-intro-complete/i);
    expect(src).toContain("Not a lawyer");
  });
});
