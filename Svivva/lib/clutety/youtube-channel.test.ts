import { describe, expect, it } from "vitest";
import { extractYtInitialData, normalizeChannelVideosUrl } from "./youtube-channel";

describe("youtube-channel", () => {
  it("normalizes @handle URLs to /videos tab", () => {
    expect(normalizeChannelVideosUrl("youtube.com/@StarterStory")).toBe(
      "https://youtube.com/@StarterStory/videos",
    );
    expect(normalizeChannelVideosUrl("https://www.youtube.com/@StarterStory/videos")).toBe(
      "https://www.youtube.com/@StarterStory/videos",
    );
  });

  it("rejects single video URLs", () => {
    expect(() => normalizeChannelVideosUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toThrow(
      /channel/i,
    );
  });

  it("extracts ytInitialData JSON from HTML", () => {
    const html = `<html><script>var ytInitialData = {"metadata":{"channelMetadataRenderer":{"title":"Starter Story"}},"contents":{"x":{"videoRenderer":{"videoId":"abcdefghijk","title":{"runs":[{"text":"How I got traffic"}]}}}}}; </script></html>`;
    const data = extractYtInitialData(html) as {
      metadata?: { channelMetadataRenderer?: { title?: string } };
    };
    expect(data?.metadata?.channelMetadataRenderer?.title).toBe("Starter Story");
  });
});
