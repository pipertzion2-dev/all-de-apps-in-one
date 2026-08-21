import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("EducationAdvocacyCornerAd", () => {
  it("is mounted from Providers for site-wide visibility", () => {
    const providers = readFileSync(resolve(__dirname, "../../../components/providers.tsx"), "utf8");
    expect(providers).toContain("EducationAdvocacyCornerAd");
  });

  it("invites new situations and helpers into the advocate console", () => {
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
