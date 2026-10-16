import { describe, expect, it } from "vitest";
import {
  buildUtmUrl,
  estimateBomLine,
  extractKeywordScan,
  pulseConversionRate,
  scoreIdeaGap,
  scoreOrbitIndexUrls,
  scoreSecurityPosture,
  sketchApiEndpoint,
  testLaunchHeadline,
} from "./feature-tool-helpers";

describe("feature tool helpers", () => {
  it("scores orbit URLs for https readiness", () => {
    const r = scoreOrbitIndexUrls("https://zzaizzai.com/tools\nhttp://example.com/a");
    expect(r.urls).toHaveLength(2);
    expect(r.httpsOk).toBe(1);
    expect(r.tips.length).toBeGreaterThan(0);
  });

  it("estimates bom lines and conversion rates", () => {
    expect(estimateBomLine(3, 2.5)).toBe(7.5);
    expect(pulseConversionRate(200, 5)).toBe(2.5);
    expect(pulseConversionRate(0, 1)).toBeNull();
  });

  it("sketches endpoints and scores ideas", () => {
    const ep = sketchApiEndpoint("get user profile by id");
    expect(ep.method).toBe("GET");
    expect(ep.path).toContain("/v1/");
    expect(scoreIdeaGap({ problemClarity: 9, audienceSize: 8, differentiation: 7 }).total).toBeGreaterThan(
      7,
    );
  });

  it("builds utm links and keyword scans", () => {
    const url = buildUtmUrl({
      baseUrl: "https://zzaizzai.com/orbit",
      source: "newsletter",
      medium: "email",
      campaign: "launch",
    });
    expect(url).toContain("utm_source=newsletter");
    const keys = extractKeywordScan("seeds seeds seeds api builder play play hybrid");
    expect(keys[0]?.word).toBe("seeds");
  });

  it("tests headlines and posture quizzes", () => {
    const h = testLaunchHeadline("Ship AI APIs fast without a backend");
    expect(h.score).toBeGreaterThan(50);
    const s = scoreSecurityPosture({ https: true, headers: true, secrets: true, deps: false, backup: false });
    expect(s.yes).toBe(3);
    expect(s.percent).toBe(60);
  });
});
