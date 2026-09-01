import { describe, expect, it } from "vitest";
import {
  formatOrbitDbSetupError,
  isMissingMarketingTableError,
} from "./db-connection-error";

describe("db-connection-error", () => {
  it("detects missing seo_landing_pages table", () => {
    expect(
      isMissingMarketingTableError(new Error('relation "seo_landing_pages" does not exist')),
    ).toBe(true);
  });

  it("formats marketing table errors with setup guidance", () => {
    const msg = formatOrbitDbSetupError(
      new Error('relation "seo_landing_pages" does not exist'),
    );
    expect(msg).toContain("Database tables are not set up yet");
  });
});
