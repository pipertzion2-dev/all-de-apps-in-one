import { describe, expect, it } from "vitest";
import { generateAssetDraft, validateAssetContent } from "./asset-generators";
import { plannedAssetsFromInput } from "./asset-types";
import type { AssetGenerationContext } from "./asset-types";
import type { PlannedAsset } from "../campaign/plan-types";

const ctx: AssetGenerationContext = {
  projectId: "proj-1",
  projectName: "TaskBot",
  productType: "seed_app",
  description: "AI task management for startups",
  canonicalUrl: "https://example.com/taskbot",
  entities: [
    { id: "f1", entityType: "feature", name: "Kanban" },
    { id: "k1", entityType: "keyword", name: "task management" },
  ],
};

const planned: PlannedAsset = {
  id: "plan-1",
  phase: "pre_launch",
  assetType: "landing_page",
  platform: "web",
  title: "TaskBot — primary landing page",
  purpose: "Core conversion page with unique value prop and CTA",
  priority: "high",
  distributionIntent: "indexing",
  targetEntityIds: ["f1"],
  keywords: ["task management"],
};

describe("generateAssetDraft", () => {
  it("generates landing page markdown from graph context", async () => {
    const draft = await generateAssetDraft(ctx, planned, { templateOnly: true });
    expect(draft.title).toBe(planned.title);
    expect(draft.body).toContain("TaskBot");
    expect(draft.body).toContain("Kanban");
    expect(draft.bodyFormat).toBe("markdown");
    expect(draft.entityId).toBe("f1");
  });

  it("generates social post for x platform", async () => {
    const draft = await generateAssetDraft(
      ctx,
      { ...planned, assetType: "social_post", platform: "x", title: "Launch thread" },
      { templateOnly: true },
    );
    expect(draft.body.length).toBeGreaterThan(20);
    expect(draft.metadata?.platform).toBe("x");
  });

  it("generates structured data as html/json body", async () => {
    const draft = await generateAssetDraft(
      ctx,
      { ...planned, assetType: "structured_data", title: "JSON-LD" },
      { templateOnly: true },
    );
    expect(draft.bodyFormat).toBe("html");
    expect(draft.body).toContain("@context");
    expect(draft.body).toContain("schema.org");
  });
});

describe("validateAssetContent", () => {
  it("passes valid web landing content", () => {
    const result = validateAssetContent({
      body: "# Hello\n\nValid content.",
      title: "Short title",
      platform: "web",
      assetType: "landing_page",
    });
    expect(result.status).toBe("passed");
    expect(result.issues).toHaveLength(0);
  });

  it("fails when body exceeds platform limit", () => {
    const result = validateAssetContent({
      body: "x".repeat(300),
      platform: "x",
      assetType: "social_post",
    });
    expect(result.status).toBe("failed");
    expect(result.issues.some((i) => i.code === "body_too_long")).toBe(true);
  });

  it("fails on blocked terms from approval policy", () => {
    const result = validateAssetContent({
      body: "This mentions a forbidden phrase here.",
      platform: "web",
      assetType: "landing_page",
      policy: { blockedTerms: ["forbidden phrase"] },
    });
    expect(result.status).toBe("failed");
    expect(result.issues.some((i) => i.code === "blocked_term")).toBe(true);
  });
});

describe("plannedAssetsFromInput", () => {
  const assets: PlannedAsset[] = [
    { ...planned, id: "a1", phase: "pre_launch" },
    { ...planned, id: "a2", phase: "launch", title: "Launch post" },
  ];

  it("filters by planned asset ids", () => {
    const filtered = plannedAssetsFromInput(assets, { plannedAssetIds: ["a2"] });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("a2");
  });

  it("filters by phase", () => {
    const filtered = plannedAssetsFromInput(assets, { phases: ["launch"] });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].phase).toBe("launch");
  });
});
