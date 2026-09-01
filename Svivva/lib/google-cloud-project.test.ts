import { describe, expect, it } from "vitest";
import {
  buildGoogleApiEnableLinks,
  extractGoogleCloudProjectFromError,
  extractGoogleCloudProjectNumber,
  isGoogleApiDisabledError,
  resolveGoogleApiEnableLinks,
  summarizeGoogleIndexingErrors,
  isGoogleIndexingOwnershipError,
} from "@/lib/google-cloud-project";

describe("google-cloud-project", () => {
  it("extracts project number from OAuth client ID", () => {
    expect(
      extractGoogleCloudProjectNumber("680989077677-abc123.apps.googleusercontent.com"),
    ).toBe("680989077677");
  });

  it("extracts project number from API error text", () => {
    const msg =
      "Web Search Indexing API has not been used in project 680989077677 before or it is disabled.";
    expect(extractGoogleCloudProjectFromError(msg)).toBe("680989077677");
  });

  it("builds enable links for a project", () => {
    const links = buildGoogleApiEnableLinks("680989077677");
    expect(links.indexingApi).toContain("680989077677");
    expect(links.indexingApi).toContain("indexing.googleapis.com");
  });

  it("detects disabled API errors", () => {
    expect(
      isGoogleApiDisabledError(
        "Web Search Indexing API has not been used in project 680989077677 before or it is disabled.",
      ),
    ).toBe(true);
  });

  it("summarizes duplicate indexing errors", () => {
    const msg =
      "Web Search Indexing API has not been used in project 680989077677 before or it is disabled.";
    expect(
      summarizeGoogleIndexingErrors([msg, msg, msg]),
    ).toBe(msg);
  });

  it("detects ownership errors separately from disabled API", () => {
    expect(isGoogleIndexingOwnershipError("Permission denied. Failed to verify the URL ownership.")).toBe(
      true,
    );
    expect(
      isGoogleApiDisabledError(
        "Web Search Indexing API has not been used in project 680989077677 before or it is disabled.",
      ),
    ).toBe(true);
  });
});
