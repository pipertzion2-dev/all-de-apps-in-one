import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { isInternalSchedulerConfigured, isOrbitAdminAllowed } from "@/lib/orbit/admin-access";

describe("orbit admin access", () => {
  const originalSecret = process.env.ORBIT_INTERNAL_SECRET;

  beforeEach(() => {
    process.env.ORBIT_INTERNAL_SECRET = "test-internal-secret";
  });

  afterEach(() => {
    process.env.ORBIT_INTERNAL_SECRET = originalSecret;
    vi.restoreAllMocks();
  });

  it("detects configured internal scheduler secret", () => {
    expect(isInternalSchedulerConfigured()).toBe(true);
    process.env.ORBIT_INTERNAL_SECRET = "";
    expect(isInternalSchedulerConfigured()).toBe(false);
  });

  it("allows internal secret header on API requests", async () => {
    const req = new Request("https://example.com/api/indexnow/submit", {
      method: "POST",
      headers: { "x-internal-secret": "test-internal-secret" },
    });
    await expect(isOrbitAdminAllowed(req)).resolves.toBe(true);
  });

  it("rejects mismatched internal secret header", async () => {
    const req = new Request("https://example.com/api/indexnow/submit", {
      method: "POST",
      headers: { "x-internal-secret": "wrong" },
    });
    vi.spyOn(await import("@/lib/auth/admin"), "hasAdminAccess").mockResolvedValue(false);
    await expect(isOrbitAdminAllowed(req)).resolves.toBe(false);
  });
});
