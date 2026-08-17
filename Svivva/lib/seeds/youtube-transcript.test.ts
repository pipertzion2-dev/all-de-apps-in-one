import { describe, expect, it } from "vitest";
import { buildYoutubeSeedDocument, classifyYoutubeSeedUrl } from "./youtube-transcript";

describe("classifyYoutubeSeedUrl", () => {
  it("detects watch URLs as videos", () => {
    const classified = classifyYoutubeSeedUrl("https://www.youtube.com/watch?v=abcdefghijk");
    expect(classified.kind).toBe("video");
    expect(classified.value).toBe("abcdefghijk");
  });

  it("detects channel URLs", () => {
    const classified = classifyYoutubeSeedUrl("https://www.youtube.com/@StarterStory");
    expect(classified.kind).toBe("channel");
  });

  it("detects youtu.be watch URLs as videos", () => {
    const classified = classifyYoutubeSeedUrl("https://youtu.be/abcdefghijk");
    expect(classified.kind).toBe("video");
    expect(classified.value).toBe("abcdefghijk");
  });

  it("rejects non-YouTube URLs", () => {
    expect(() => classifyYoutubeSeedUrl("https://example.com/watch")).toThrow(/Paste a YouTube/);
  });

  it("rejects empty input", () => {
    expect(() => classifyYoutubeSeedUrl("  ")).toThrow(/Paste a YouTube/);
  });
});

describe("buildYoutubeSeedDocument", () => {
  it("includes transcripts as seed source material", () => {
    const doc = buildYoutubeSeedDocument({
      sourceLabel: "Starter Story",
      sourceUrl: "https://www.youtube.com/@StarterStory",
      clips: [
        {
          title: "How to get traffic",
          url: "https://www.youtube.com/watch?v=abcdefghijk",
          transcript: "Post on Reddit and build SEO landing pages.",
        },
      ],
    });
    expect(doc).toContain("YouTube transcript briefing");
    expect(doc).toContain("Post on Reddit");
    expect(doc).toContain("Starter Story");
  });
});
