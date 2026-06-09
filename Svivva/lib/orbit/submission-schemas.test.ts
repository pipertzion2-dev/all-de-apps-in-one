import { describe, expect, it } from "vitest";
import {
  SUBMISSION_ITEMS,
  formatFieldsForClipboard,
  getSubmissionItem,
  itemsByKind,
} from "./submission-schemas";

describe("submission-schemas", () => {
  it("includes directory and publish items for checklist", () => {
    expect(itemsByKind("directory").length).toBeGreaterThanOrEqual(5);
    expect(itemsByKind("publish").length).toBeGreaterThanOrEqual(8);
    expect(getSubmissionItem("dir-futurepedia")?.directoryId).toBe("futurepedia");
    expect(getSubmissionItem("manual-devto")?.id).toBe("pub-devto");
  });

  it("formats clipboard text with labels", () => {
    const item = SUBMISSION_ITEMS[0];
    const text = formatFieldsForClipboard(item, {
      productName: "Svivva",
      websiteUrl: "https://svivva.com",
    });
    expect(text).toContain("Svivva");
    expect(text).toContain(item.submitUrl);
  });
});
