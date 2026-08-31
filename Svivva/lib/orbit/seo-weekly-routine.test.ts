import { describe, expect, it } from "vitest";
import { FUSION_PAIRS } from "@/lib/orbit/intent-fusion-pages";
import { buildSeoLearningRoadmap } from "@/lib/orbit/seo-learning-roadmap";

describe("intent-fusion-pages", () => {
  it("defines at least 10 fusion pairings", () => {
    expect(FUSION_PAIRS.length).toBeGreaterThanOrEqual(10);
  });

  it("each fusion pair has unique slug and keyword", () => {
    const slugs = new Set(FUSION_PAIRS.map((p) => p.slug));
    const keywords = new Set(FUSION_PAIRS.map((p) => p.keyword));
    expect(slugs.size).toBe(FUSION_PAIRS.length);
    expect(keywords.size).toBe(FUSION_PAIRS.length);
  });
});

describe("seo-learning-roadmap", () => {
  it("builds a 4-week roadmap with percent progress", async () => {
    const roadmap = await buildSeoLearningRoadmap();
    expect(roadmap.weeks).toHaveLength(4);
    expect(roadmap.overallPercent).toBeGreaterThanOrEqual(0);
    expect(roadmap.overallPercent).toBeLessThanOrEqual(100);
    expect(roadmap.currentWeek).toBeGreaterThanOrEqual(1);
    expect(roadmap.currentWeek).toBeLessThanOrEqual(4);
    for (const w of roadmap.weeks) {
      expect(w.items.length).toBeGreaterThan(0);
      expect(w.percent).toBeGreaterThanOrEqual(0);
      expect(w.percent).toBeLessThanOrEqual(100);
    }
  });
});
