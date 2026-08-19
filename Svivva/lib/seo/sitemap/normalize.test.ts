import { describe, expect, it } from "vitest";
import { dedupeSitemapUrls, normalizeSitemapUrl } from "./normalize";

describe("sitemap normalize", () => {
  const base = "https://zzaizzai.com";

  it("normalizes host and strips trailing slashes", () => {
    expect(normalizeSitemapUrl("http://www.example.com/blog/", base)).toBe(`${base}/blog`);
    expect(normalizeSitemapUrl(`${base}/tools/`, base)).toBe(`${base}/tools`);
    expect(normalizeSitemapUrl(`${base}/`, base)).toBe(`${base}/`);
  });

  it("dedupes URLs that differ only by trailing slash", () => {
    const deduped = dedupeSitemapUrls([
      { url: `${base}/blog` },
      { url: `${base}/blog/` },
      { url: `${base}/tools` },
    ]);
    expect(deduped).toHaveLength(2);
  });
});
