import { describe, expect, it } from "vitest";
import {
  GSC_OAUTH_LOGIN_HINT,
  isCanonicalGscOAuthEmail,
  resolveGscOAuthLoginHint,
} from "@/lib/gsc-oauth-connect-url";

describe("gsc-oauth-connect-url", () => {
  it("defaults to pipertzion2@gmail.com", () => {
    expect(GSC_OAUTH_LOGIN_HINT).toBe("pipertzion2@gmail.com");
    expect(resolveGscOAuthLoginHint()).toBe("pipertzion2@gmail.com");
  });

  it("prefers explicit email over defaults", () => {
    expect(resolveGscOAuthLoginHint("pipertzion2@gmail.com")).toBe("pipertzion2@gmail.com");
  });

  it("rejects non-canonical signed-in accounts", () => {
    expect(isCanonicalGscOAuthEmail("pipertzion2@gmail.com")).toBe(true);
    expect(isCanonicalGscOAuthEmail("pipertzion@gmail.com")).toBe(false);
  });
});
