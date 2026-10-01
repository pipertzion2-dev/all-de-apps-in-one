import { describe, expect, it } from "vitest";
import { isIndexRecordStuckSubmitted } from "./recommendation-engine";

describe("isIndexRecordStuckSubmitted", () => {
  const now = new Date("2026-08-18T12:00:00Z");

  it("returns false when submittedAt is missing", () => {
    expect(isIndexRecordStuckSubmitted(null, now)).toBe(false);
    expect(isIndexRecordStuckSubmitted(undefined, now)).toBe(false);
  });

  it("returns false when submitted within 3 days", () => {
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    expect(isIndexRecordStuckSubmitted(twoDaysAgo, now)).toBe(false);
  });

  it("returns true when submitted more than 3 days ago", () => {
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
    expect(isIndexRecordStuckSubmitted(fourDaysAgo, now)).toBe(true);
  });

  it("accepts ISO string dates", () => {
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
    expect(isIndexRecordStuckSubmitted(fourDaysAgo, now)).toBe(true);
  });
});
