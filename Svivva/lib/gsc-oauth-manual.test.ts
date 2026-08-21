import { describe, expect, it } from "vitest";
import { parseGscOAuthCallbackUrl } from "@/lib/gsc-oauth-manual";

describe("parseGscOAuthCallbackUrl", () => {
  it("extracts code and state from a Google redirect URL", () => {
    const parsed = parseGscOAuthCallbackUrl(
      "https://zzaizzai.com/api/gsc/oauth/callback?state=abc123&code=4/0Aean&scope=email",
    );
    expect(parsed).toEqual({ code: "4/0Aean", state: "abc123" });
  });

  it("returns null for incomplete URLs", () => {
    expect(parseGscOAuthCallbackUrl("https://zzaizzai.com/api/gsc/oauth/callback?code=only")).toBe(
      null,
    );
    expect(parseGscOAuthCallbackUrl("not-a-url")).toBe(null);
  });
});
