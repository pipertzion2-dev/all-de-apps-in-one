import { describe, expect, it } from "vitest";
import {
  ADMIN_DEFAULT_YOUTUBE_CHANNEL,
  isStarterStoryChannelUrl,
} from "./youtube-defaults";

describe("youtube-defaults", () => {
  it("recognizes StarterStory channel URLs", () => {
    expect(isStarterStoryChannelUrl(ADMIN_DEFAULT_YOUTUBE_CHANNEL)).toBe(true);
    expect(isStarterStoryChannelUrl("https://www.youtube.com/@StarterStory/videos")).toBe(true);
    expect(isStarterStoryChannelUrl("https://www.youtube.com/@otherchannel")).toBe(false);
  });
});
