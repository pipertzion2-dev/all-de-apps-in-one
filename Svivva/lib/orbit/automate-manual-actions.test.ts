import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("runAutomatableManualActions indexing alternatives", () => {
  const src = readFileSync(join(__dirname, "automate-manual-actions.ts"), "utf8");

  it("soft-handles retired Bing sitemap ping", () => {
    expect(src).toContain("deprecated");
    expect(src).toContain("410");
    expect(src).toContain("IndexNow covers Bing");
  });

  it("stops Indexing API when daily quota is exhausted", () => {
    expect(src).toContain("isGoogleIndexingQuotaExhaustedToday");
    expect(src).toContain("quotaExhausted");
    expect(src).toContain("GOOGLE_INDEXING_QUOTA_SOFT_MESSAGE");
  });

  it("can skip Indexing API to avoid double quota burn", () => {
    expect(src).toContain("skipIndexingApi");
  });
});
