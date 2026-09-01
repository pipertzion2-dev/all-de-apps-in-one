import { describe, expect, it } from "vitest";
import {
  dedupeErrorMessages,
  formatOrbitRunError,
  formatIndexingApiError,
} from "./orbit-error-messages";

describe("orbit-error-messages", () => {
  it("dedupes repeated Google indexing quota errors", () => {
    const raw =
      "Quota exceeded for quota metric 'Publish requests' and limit 'Publish requests per day' of service 'indexing.googleapis.com' for consumer 'project_number:680989077677'.";
    const out = dedupeErrorMessages([raw, raw]);
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("daily quota");
  });

  it("formats EasyPeasy word limit with actions", () => {
    const hint = formatOrbitRunError(
      "429 You reached the limit of allowed words in your plan. Please upgrade your plan to continue.",
    );
    expect(hint.title).toContain("EasyPeasy");
    expect(hint.actions.length).toBeGreaterThan(0);
  });

  it("shortens indexing API quota prose", () => {
    expect(formatIndexingApiError("Quota exceeded for Publish requests per day")).toContain(
      "daily quota",
    );
  });
});
