import { describe, expect, it } from "vitest";
import { buildCampaignPlanFromGraph, countPlannedAssets } from "./planner";
import type { GraphContext } from "./plan-types";

const baseContext: GraphContext = {
  projectId: "proj-1",
  projectName: "Example Site",
  productType: "website",
  description: "A test site",
  entities: [
    {
      id: "e1",
      entityType: "page",
      name: "Home",
      url: "https://example.com",
      metadata: { hasMetaDescription: true, hasH1: true },
    },
    {
      id: "k1",
      entityType: "keyword",
      name: "example keyword",
    },
  ],
};

describe("buildCampaignPlanFromGraph", () => {
  it("builds website SEO plan with indexing and social assets", () => {
    const plan = buildCampaignPlanFromGraph(baseContext);
    expect(plan.productType).toBe("website");
    expect(plan.objective).toBe("traffic");
    expect(countPlannedAssets(plan)).toBeGreaterThan(0);

    const assetTypes = plan.phases.flatMap((p) => p.assets.map((a) => a.assetType));
    expect(assetTypes).toContain("landing_page");
    expect(assetTypes).toContain("social_post");
    expect(assetTypes).toContain("indexing_submit");

    const intents = plan.phases.flatMap((p) => p.assets.map((a) => a.distributionIntent));
    expect(intents).toContain("indexing");
    expect(intents).toContain("auto_if_configured");
  });

  it("builds play release plan with youtube and release page", () => {
    const plan = buildCampaignPlanFromGraph({
      ...baseContext,
      productType: "play_release",
      projectName: "My Game",
      entities: [
        {
          id: "e1",
          entityType: "release",
          name: "My Game",
          url: "https://zzaizzai.com/play/my-game",
          metadata: { slug: "my-game", hasCover: true },
        },
        {
          id: "e2",
          entityType: "song",
          name: "Track One",
          metadata: { bpm: 120, key: "Am" },
        },
      ],
    });
    expect(plan.productType).toBe("play_release");
    expect(plan.objective).toBe("stream");

    const assetTypes = plan.phases.flatMap((p) => p.assets.map((a) => a.assetType));
    expect(assetTypes).toContain("release_page");
    expect(assetTypes).toContain("youtube_description");

    const platforms = plan.phases.flatMap((p) => p.assets.map((a) => a.platform));
    expect(platforms).toContain("youtube");
  });

  it("builds seed app plan with landing and docs", () => {
    const plan = buildCampaignPlanFromGraph({
      ...baseContext,
      productType: "seed_app",
      entities: [
        {
          id: "e1",
          entityType: "seed_app",
          name: "Todo App",
          url: "https://zzaizzai.com/seeds/todo",
          metadata: { slug: "todo", hasDescription: true },
        },
        {
          id: "f1",
          entityType: "feature",
          name: "Task sync",
        },
      ],
    });
    expect(plan.productType).toBe("seed_app");
    expect(plan.objective).toBe("signup");

    const assetTypes = plan.phases.flatMap((p) => p.assets.map((a) => a.assetType));
    expect(assetTypes).toContain("landing_page");
    expect(assetTypes).toContain("blog_post");

    const platforms = plan.phases.flatMap((p) => p.assets.map((a) => a.platform));
    expect(platforms).toContain("devto");
    expect(plan.recommendedChannels).toContain("devto");
  });

  it("respects maxAssets cap", () => {
    const plan = buildCampaignPlanFromGraph(baseContext, { maxAssets: 3 });
    expect(countPlannedAssets(plan)).toBeLessThanOrEqual(3);
  });

  it("is deterministic for same context", () => {
    const a = buildCampaignPlanFromGraph(baseContext);
    const b = buildCampaignPlanFromGraph(baseContext);
    const keysA = a.phases.flatMap((p) => p.assets.map((x) => x.assetType + x.title));
    const keysB = b.phases.flatMap((p) => p.assets.map((x) => x.assetType + x.title));
    expect(keysA).toEqual(keysB);
    expect(a.objective).toBe(b.objective);
  });
});
