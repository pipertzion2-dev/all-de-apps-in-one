import { describe, expect, it } from "vitest";
import { isGoogleOAuthInvalidGrant } from "./google-gsc-oauth";

describe("google gsc oauth", () => {
  it("detects invalid_grant refresh failures", () => {
    expect(isGoogleOAuthInvalidGrant(new Error("invalid_grant"))).toBe(true);
    expect(isGoogleOAuthInvalidGrant("token refresh failed: invalid_grant")).toBe(true);
    expect(isGoogleOAuthInvalidGrant(new Error("network error"))).toBe(false);
  });
});
