import { describe, expect, it, beforeEach } from "vitest";
import {
  clearGoogleIndexingQuotaExhaustedForTests,
  isGoogleIndexingQuotaExhaustedToday,
  markGoogleIndexingQuotaExhausted,
  noteGoogleIndexingErrors,
  GOOGLE_INDEXING_QUOTA_SOFT_MESSAGE,
} from "./google-indexing-quota";

describe("google-indexing-quota", () => {
  beforeEach(() => {
    clearGoogleIndexingQuotaExhaustedForTests();
  });

  it("starts unset and marks exhausted for today", () => {
    expect(isGoogleIndexingQuotaExhaustedToday()).toBe(false);
    markGoogleIndexingQuotaExhausted();
    expect(isGoogleIndexingQuotaExhaustedToday()).toBe(true);
  });

  it("notes raw Google quota errors", () => {
    expect(
      noteGoogleIndexingErrors([
        "Quota exceeded for quota metric 'Publish requests' and limit 'Publish requests per day' of service 'indexing.googleapis.com'.",
      ]),
    ).toBe(true);
    expect(isGoogleIndexingQuotaExhaustedToday()).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(noteGoogleIndexingErrors(["IndexNow 403", "network timeout"])).toBe(false);
    expect(isGoogleIndexingQuotaExhaustedToday()).toBe(false);
  });

  it("exposes a soft discovery message", () => {
    expect(GOOGLE_INDEXING_QUOTA_SOFT_MESSAGE).toContain("IndexNow");
  });
});
