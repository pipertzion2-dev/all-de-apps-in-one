import { describe, expect, it } from "vitest";
import { filesRequireProductionDeploy, isProductionShipPath } from "./vercel-deploy-diff.mjs";

describe("isProductionShipPath", () => {
  it("treats app and lib sources as production", () => {
    expect(isProductionShipPath("Svivva/app/page.tsx")).toBe(true);
    expect(isProductionShipPath("lib/orbit/seo-weekly-routine.ts")).toBe(true);
  });

  it("ignores scripts, tests, and docs-only paths", () => {
    expect(isProductionShipPath("Svivva/scripts/attach-legacy-domain.mjs")).toBe(false);
    expect(isProductionShipPath("lib/orbit/seo-weekly-routine.test.ts")).toBe(false);
  });
});

describe("filesRequireProductionDeploy", () => {
  it("returns false for scripts-only prettier commit files", () => {
    expect(filesRequireProductionDeploy(["Svivva/scripts/attach-legacy-domain.mjs"])).toBe(false);
  });

  it("returns true for SEO automation app changes", () => {
    expect(
      filesRequireProductionDeploy([
        "Svivva/app/api/orbit/seo-weekly-routine/route.ts",
        "Svivva/lib/orbit/seo-weekly-routine.ts",
      ]),
    ).toBe(true);
  });
});
