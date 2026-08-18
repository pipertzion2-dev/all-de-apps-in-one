import { describe, expect, it } from "vitest";
import { parseRedditPayload, parseTwitterPayload, parseAssetPayload } from "./asset-payload-parser";
import {
  resolvePublishProvider,
  fallbackProvider,
  omnisocialsPlatforms,
} from "./platform-provider-map";
import {
  statusAfterPublish,
  canRetryJob,
  computeRetryScheduledAt,
  canTransitionJob,
} from "./distribution-state-machine";
import { buildIdempotencyKey } from "./distribution-repository";
import type { OrbitContentAsset } from "../schema";

describe("platform-provider-map", () => {
  it("maps auto platforms to API providers", () => {
    expect(resolvePublishProvider("devto", "auto_if_configured")).toBe("devto");
    expect(resolvePublishProvider("x", "auto_if_configured")).toBe("omnisocials");
    expect(resolvePublishProvider("reddit", "auto_if_configured")).toBe("reddit");
  });

  it("maps manual_ready to manual provider", () => {
    expect(resolvePublishProvider("hn", "manual_ready")).toBe("manual");
  });

  it("returns null for indexing intent", () => {
    expect(resolvePublishProvider("web", "indexing")).toBeNull();
  });

  it("falls back x from omnisocials to twitter", () => {
    expect(fallbackProvider("x", "omnisocials")).toBe("twitter");
  });

  it("maps omnisocials platform aliases", () => {
    expect(omnisocialsPlatforms("x")).toContain("x");
    expect(omnisocialsPlatforms("linkedin")).toContain("linkedin");
  });
});

describe("asset-payload-parser", () => {
  it("parses reddit title from bold markdown", () => {
    const payload = parseRedditPayload("**My Launch**\n\nBody text here");
    expect(payload.title).toBe("My Launch");
    expect(payload.body).toBe("Body text here");
    expect(payload.subreddit).toBe("SideProject");
  });

  it("parses twitter thread from separators", () => {
    const payload = parseTwitterPayload("Tweet one\n---\nTweet two");
    expect(payload.thread).toEqual(["Tweet one", "Tweet two"]);
  });

  it("parses devto asset payload", () => {
    const asset = {
      id: "a1",
      platform: "devto",
      assetType: "blog_post",
      title: "Launch story",
      body: "# Title\n\nContent here",
      bodyFormat: "markdown",
      version: 1,
      metadata: { tags: ["orbit"] },
    } as unknown as OrbitContentAsset;
    const payload = parseAssetPayload(asset);
    expect(payload.title).toBe("Launch story");
    expect(payload.tags).toEqual(["orbit"]);
  });
});

describe("distribution state machine", () => {
  it("statusAfterPublish distinguishes success and manual", () => {
    expect(statusAfterPublish(true)).toBe("succeeded");
    expect(statusAfterPublish(false, true)).toBe("ready_for_manual");
    expect(statusAfterPublish(false)).toBe("failed");
  });

  it("canRetryJob respects max retries", () => {
    expect(canRetryJob("failed", 0, 3)).toBe(true);
    expect(canRetryJob("failed", 3, 3)).toBe(false);
  });

  it("computeRetryScheduledAt is in the future", () => {
    expect(computeRetryScheduledAt(1).getTime()).toBeGreaterThan(Date.now());
  });

  it("canTransitionJob allows pending → running", () => {
    expect(canTransitionJob("pending", "running")).toBe(true);
    expect(canTransitionJob("succeeded", "pending")).toBe(false);
  });
});

describe("buildIdempotencyKey", () => {
  it("includes asset id provider and version", () => {
    expect(buildIdempotencyKey("asset-1", "devto", 2)).toBe("asset-1:devto:publish:v2");
  });
});
