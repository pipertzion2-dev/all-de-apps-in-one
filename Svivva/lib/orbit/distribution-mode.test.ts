import { describe, expect, it } from "vitest";
import {
  copyReadyOrNeedsCredentials,
  hasAutoPostCredentials,
  isCopyOnlyDistributionMode,
} from "./distribution-mode";

describe("distribution-mode", () => {
  it("detects when no auto-post credentials are configured", () => {
    expect(hasAutoPostCredentials({})).toBe(false);
    expect(isCopyOnlyDistributionMode({})).toBe(true);
  });

  it("detects configured social API", () => {
    expect(hasAutoPostCredentials({ ayrshareApiKey: "key" })).toBe(true);
    expect(isCopyOnlyDistributionMode({ ayrshareApiKey: "key" })).toBe(false);
  });

  it("maps copy-only to prepared status", () => {
    const r = copyReadyOrNeedsCredentials({
      copyOnly: true,
      needsCredentialsMessage: "add key",
    });
    expect(r.status).toBe("prepared");
  });

  it("maps distribution mode to needs_credentials when auto-post enabled", () => {
    const r = copyReadyOrNeedsCredentials({
      copyOnly: false,
      needsCredentialsMessage: "add key",
    });
    expect(r.status).toBe("needs_credentials");
    expect(r.message).toBe("add key");
  });
});
