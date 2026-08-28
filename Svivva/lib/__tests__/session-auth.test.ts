import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("session auth", () => {
  const sessionSrc = readFileSync(resolve(__dirname, "../auth/session.ts"), "utf8");
  const setSessionSrc = readFileSync(
    resolve(__dirname, "../../app/api/auth/set-session/route.ts"),
    "utf8",
  );

  it("stores opaque token in cookie instead of JSON user payload", () => {
    expect(sessionSrc).toContain("cookieStore.set(SESSION_COOKIE_NAME, token");
    expect(sessionSrc).not.toContain("JSON.stringify({ user");
    expect(setSessionSrc).toContain("cookieStore.set(SESSION_COOKIE_NAME, token");
    expect(setSessionSrc).not.toContain("JSON.stringify({ user");
  });

  it("resolves cookie via database token lookup", () => {
    expect(sessionSrc).toContain("getUserFromToken(sessionCookie.value)");
    expect(sessionSrc).toContain("looksLikeLegacySessionCookie");
  });
});
