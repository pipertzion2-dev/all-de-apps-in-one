import { describe, expect, it } from "vitest";
import {
  isValidGscOAuthClientId,
  isValidGscOAuthCredentials,
  gscOAuthConfigProblem,
  normalizeGscOAuthClientId,
  normalizeGscOAuthClientSecret,
} from "@/lib/gsc-oauth-credentials";

describe("gsc-oauth-credentials", () => {
  it("rejects Vercel placeholder client id", () => {
    expect(isValidGscOAuthClientId("your-client-id.apps.googleusercontent.com")).toBe(false);
    expect(
      isValidGscOAuthCredentials(
        "your-client-id.apps.googleusercontent.com",
        "GOCSPX-real-secret-value",
      ),
    ).toBe(false);
  });

  it("accepts real-looking Google OAuth web client id", () => {
    expect(
      isValidGscOAuthClientId("123456789012-abcdefghijklmnop.apps.googleusercontent.com"),
    ).toBe(true);
  });

  it("describes placeholder config problem", () => {
    expect(
      gscOAuthConfigProblem("your-client-id.apps.googleusercontent.com", "your-client-secret"),
    ).toMatch(/placeholder/i);
  });

  it("extracts client_id from JSON credentials paste", () => {
    const json =
      '{"web":{"client_id":"123456789012-abc.apps.googleusercontent.com","client_secret":"GOCSPX-secret"}}';
    expect(normalizeGscOAuthClientId(json)).toBe("123456789012-abc.apps.googleusercontent.com");
    expect(normalizeGscOAuthClientSecret(json)).toBe("GOCSPX-secret");
  });
});
