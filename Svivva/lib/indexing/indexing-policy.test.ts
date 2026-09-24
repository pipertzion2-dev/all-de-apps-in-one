import { describe, expect, it, vi, afterEach } from "vitest";
import {
  clampGoogleMaxBatches,
  GOOGLE_INDEXING_MAX_BATCHES_PER_RUN,
  indexNowMaxUrlsPerRun,
} from "@/lib/indexing/indexing-policy";

describe("indexing-policy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults IndexNow cap to 200", () => {
    expect(indexNowMaxUrlsPerRun()).toBe(200);
  });

  it("clamps Google batches per run", () => {
    expect(clampGoogleMaxBatches()).toBe(1);
    expect(clampGoogleMaxBatches(99)).toBe(GOOGLE_INDEXING_MAX_BATCHES_PER_RUN);
  });

  it("reads INDEXNOW_MAX_URLS_PER_RUN", () => {
    vi.stubEnv("INDEXNOW_MAX_URLS_PER_RUN", "350");
    expect(indexNowMaxUrlsPerRun()).toBe(350);
  });
});
