import { describe, expect, it } from "vitest";
import { scorePageContent } from "@/lib/seo/content-quality/score";
import {
  FEATURE_MINI_APPS,
  BLEND_PREVIEW_CHANNELS,
  chooseCubeFace,
  featureMiniAppsPassQualityGate,
  generateFeatureMiniAppSeoPages,
} from "./feature-mini-apps";

describe("feature mini-apps", () => {
  it("ships five one-job slices, not full products", () => {
    expect(FEATURE_MINI_APPS).toHaveLength(6);
    for (const app of FEATURE_MINI_APPS) {
      expect(app.path).toMatch(/^\/tools\//);
      expect(app.sliceNote.length).toBeGreaterThan(20);
      expect(app.parentHref.length).toBeGreaterThan(1);
    }
  });

  it("maps a job to a cube face without loading the 3D cube", () => {
    const face = chooseCubeFace("seeds");
    expect(face.href).toBe("/seeds");
    expect(face.shortLabel).toBe("Seeds");
  });

  it("lists a small public channel set for H¹ preview", () => {
    const ids = BLEND_PREVIEW_CHANNELS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("seeds");
    expect(ids).not.toContain("orbit");
  });

  it("writes SEO pages that pass the quality gate and funnel to zzaizzai.com", () => {
    expect(featureMiniAppsPassQualityGate()).toBe(true);
    const pages = generateFeatureMiniAppSeoPages(FEATURE_MINI_APPS[0]);
    expect(pages.length).toBe(4);
    for (const page of pages) {
      expect(page.content).toContain("zzaizzai.com");
      expect(page.content).toContain(FEATURE_MINI_APPS[0].path);
      const score = scorePageContent({
        title: page.title,
        content: page.content,
        howItWorks: page.subheadline,
        whoItsFor: "Developers and teams building with AI on ZZAI",
        hasFaq: true,
      });
      expect(score.passed).toBe(true);
    }
  });
});
