import { describe, expect, it } from "vitest";
import {
  homepageJsonLdGraph,
  siteWideJsonLdGraph,
  videoGameSchema,
  eventSeriesSchema,
} from "./builders";

describe("JSON-LD builders", () => {
  it("keeps site-wide layout graph to Organization + WebSite only", () => {
    const types = siteWideJsonLdGraph().map((g) => (g as { "@type"?: string })["@type"]);
    expect(types).toEqual(["Organization", "WebSite"]);
    expect(types).not.toContain("FAQPage");
    expect(types).not.toContain("HowTo");
  });

  it("keeps FAQ + HowTo on the homepage graph", () => {
    const types = homepageJsonLdGraph().map((g) => (g as { "@type"?: string })["@type"]);
    expect(types).toEqual(
      expect.arrayContaining(["FAQPage", "HowTo", "SoftwareApplication", "Organization"]),
    );
  });

  it("builds VideoGame schema for Klean Sneaks", () => {
    const game = videoGameSchema();
    expect(game["@type"]).toBe("VideoGame");
    expect(game.url).toMatch(/\/clean-sneaks$/);
    expect(game.name).toMatch(/Klean Sneaks/i);
  });

  it("builds EventSeries schema for ZZAI Show", () => {
    const series = eventSeriesSchema();
    expect(series["@type"]).toBe("EventSeries");
    expect(series.url).toMatch(/\/events$/);
  });
});
