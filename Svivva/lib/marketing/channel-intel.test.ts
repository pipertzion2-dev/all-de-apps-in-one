import { describe, expect, it } from "vitest";
import {
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
