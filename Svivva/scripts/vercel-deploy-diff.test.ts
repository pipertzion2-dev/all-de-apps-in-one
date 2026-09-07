import { describe, expect, it } from "vitest";
import { diffRequiresProductionDeploy, isProductionShipPath } from "./vercel-deploy-diff.mjs";

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

describe("diffRequiresProductionDeploy", () => {
  it("returns false for scripts-only prettier commit", () => {
    expect(diffRequiresProductionDeploy("491bc5d1", "5eb00bef", "..")).toBe(false);
  });

  it("returns true for SEO automation app changes", () => {
    expect(diffRequiresProductionDeploy("ced78206", "f6c1be64", "..")).toBe(true);
  });
});
