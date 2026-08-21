import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("EducationAdvocacyCornerAd", () => {
  it("is mounted from Providers for site-wide visibility", () => {
    const providers = readFileSync(resolve(__dirname, "../../../components/providers.tsx"), "utf8");
    expect(providers).toContain("EducationAdvocacyCornerAd");
  });

  it("targets parent/faculty academic interference and links to the advocate console", () => {
    const src = readFileSync(
      resolve(__dirname, "../../../components/education-advocacy/corner-ad.tsx"),
      "utf8",
    );
    expect(src).toContain("/dashboard/education-advocacy");
    expect(src).toContain("parent");
    expect(src).toMatch(/faculty/i);
    expect(src).toContain("backdrop-blur");
    expect(src).toContain("Not a lawyer");
  });
});
