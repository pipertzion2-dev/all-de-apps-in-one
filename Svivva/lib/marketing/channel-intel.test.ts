import { describe, expect, it } from "vitest";
import {
  computeNextRunAt,
  diffNewVideoIds,
  isWatchDue,
  rankVideosForQuery,
  scoreVideoForQuery,
  type ChannelIntelCorpus,
  type ChannelIntelVideo,
} from "./channel-intel";

describe("channel-intel scoring", () => {
  const video: ChannelIntelVideo = {
    videoId: "abcdefghijk",
    title: "How to get traffic for your SaaS app",
    url: "https://www.youtube.com/watch?v=abcdefghijk",
    channel: "Starter Story",
    description: "SEO and Reddit tactics",
    transcript: "Post on Reddit communities and build SEO landing pages for your app traffic.",
    transcriptLength: 80,
    hasTranscript: true,
  };

  const corpus: ChannelIntelCorpus = {
    channelTitle: "Starter Story",
    channelUrl: "https://www.youtube.com/@StarterStory/videos",
    ingestedAt: "2026-08-17T00:00:00.000Z",
    videos: [video],
    stats: { listed: 1, withTranscript: 1, failed: 0 },
  };

  it("scores videos by query terms", () => {
    expect(scoreVideoForQuery(video, "app traffic")).toBeGreaterThan(5);
    expect(scoreVideoForQuery(video, "unrelated xyz")).toBe(0);
  });

  it("ranks and excerpts matching videos", () => {
    const ranked = rankVideosForQuery(corpus, "Reddit traffic");
    expect(ranked[0]?.title).toContain("SaaS");
    expect(ranked[0]?.excerpt.length).toBeGreaterThan(10);
  });
});

describe("channel-intel watch scheduling", () => {
  it("computes cadence offsets", () => {
    const from = new Date("2026-08-17T00:00:00.000Z");
    expect(computeNextRunAt("daily", from)).toBe("2026-08-18T00:00:00.000Z");
    expect(computeNextRunAt("every_3_days", from)).toBe("2026-08-20T00:00:00.000Z");
    expect(computeNextRunAt("weekly", from)).toBe("2026-08-24T00:00:00.000Z");
  });

  it("marks disabled watches as not due", () => {
    expect(isWatchDue("2020-01-01T00:00:00.000Z", false)).toBe(false);
    expect(isWatchDue("2020-01-01T00:00:00.000Z", true, new Date("2026-01-01"))).toBe(true);
    expect(isWatchDue("2099-01-01T00:00:00.000Z", true, new Date("2026-01-01"))).toBe(false);
  });

  it("diffs new video ids", () => {
    expect(diffNewVideoIds(["aaa", "bbb"], ["bbb", "ccc", "aaa"])).toEqual(["ccc"]);
  });
});
