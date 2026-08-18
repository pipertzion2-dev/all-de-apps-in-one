import { describe, it, expect } from "vitest";
import { buildManualIngestSnapshot } from "./adapters/manual";
import { buildSeedIngestSnapshot } from "./adapters/seed";
import { buildPlayIngestSnapshot } from "./adapters/play";
import { buildApiProjectIngestSnapshot } from "./adapters/api-project";
import type { SeedAppSpec } from "@/lib/schema";

describe("buildManualIngestSnapshot", () => {
  it("creates a single product entity", () => {
    const snap = buildManualIngestSnapshot({
      name: "Launch Q3",
      description: "Fall release",
      productType: "campaign",
    });
    expect(snap.projectName).toBe("Launch Q3");
    expect(snap.entities).toHaveLength(1);
    expect(snap.entities[0].entityType).toBe("product");
    expect(snap.links).toHaveLength(0);
  });
});

describe("buildSeedIngestSnapshot", () => {
  it("maps features and api endpoints to graph entities", () => {
    const spec: SeedAppSpec = {
      appName: "TaskBot",
      problemStatement: "Teams lose track of work",
      targetUsers: "Startups",
      features: ["Kanban", "Alerts"],
      userFlows: ["Sign up"],
      databaseSchema: "users",
      apiEndpoints: ["/api/tasks"],
      uiComponents: ["Board"],
      businessModel: "SaaS",
      deploymentPreferences: "Vercel",
    };
    const snap = buildSeedIngestSnapshot("seed-1", "TaskBot", spec);
    expect(snap.entities.filter((e) => e.entityType === "feature")).toHaveLength(2);
    expect(snap.entities.filter((e) => e.entityType === "api")).toHaveLength(1);
    expect(snap.links.filter((l) => l.linkType === "has_feature")).toHaveLength(2);
    expect(snap.productType).toBe("seed_app");
  });
});

describe("buildPlayIngestSnapshot", () => {
  it("creates release and song entities", () => {
    const snap = buildPlayIngestSnapshot(
      "play-1",
      { name: "Midnight Drive", userPrompt: "Synthwave single" },
      { bpm: 120, key: "Am" },
    );
    expect(snap.productType).toBe("play_release");
    expect(snap.entities.map((e) => e.entityType).sort()).toEqual(["release", "song"]);
    expect(snap.links).toHaveLength(1);
    expect(snap.summary).toMatchObject({ bpm: 120, key: "Am" });
  });
});

describe("buildApiProjectIngestSnapshot", () => {
  it("creates product and api nodes from prompt project", () => {
    const snap = buildApiProjectIngestSnapshot({
      id: "proj-1",
      ownerId: "user-1",
      name: "Sentiment API",
      slug: "sentiment",
      description: "Classify text",
      systemPrompt: "Analyze sentiment",
      outputSchema: { type: "object", properties: { score: { type: "number" } } },
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(snap.entities).toHaveLength(2);
    expect(snap.entities[1].url).toBe("/api/run/sentiment");
    expect(snap.summary).toMatchObject({ schemaFieldCount: 1 });
  });
});
