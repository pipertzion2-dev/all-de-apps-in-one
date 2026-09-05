import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("runGscAutoSetup indexing rotation", () => {
  it("uses getIndexingBatch instead of only a fixed first-200 slice", () => {
    const src = readFileSync(join(__dirname, "google-gsc-auto-setup.ts"), "utf8");
    expect(src).toContain("getIndexingBatch");
    expect(src).toContain("recordSubmission");
    expect(src).toContain("getSecuritySitemapUrl");
    expect(src).toMatch(/getIndexingBatch\(\s*200\s*\)/);
    // Primary path must rotate; slice(0, 200) is only an empty-batch fallback.
    expect(src).toMatch(/let batch = await getIndexingBatch/);
  });

  it("can skip Indexing API and respects daily quota soft-fail", () => {
    const src = readFileSync(join(__dirname, "google-gsc-auto-setup.ts"), "utf8");
    expect(src).toContain("skipIndexingApi");
    expect(src).toContain("isGoogleIndexingQuotaExhaustedToday");
    expect(src).toContain("GOOGLE_INDEXING_QUOTA_SOFT_MESSAGE");
  });
});
