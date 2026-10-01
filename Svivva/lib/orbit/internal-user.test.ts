import { afterEach, describe, expect, it, vi } from "vitest";

describe("resolveOrbitOwnerUserId", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns ADMIN_USER_ID when set", async () => {
    vi.stubEnv("ADMIN_USER_ID", "user-abc");
    const { resolveOrbitOwnerUserId } = await import("./internal-user");
    await expect(resolveOrbitOwnerUserId()).resolves.toBe("user-abc");
  });

  it("falls back to orbit-admin when nothing is configured", async () => {
    vi.stubEnv("ADMIN_USER_ID", "");
    vi.stubEnv("ORBIT_INTERNAL_USER_ID", "");
    const { resolveOrbitOwnerUserId, ORBIT_OWNER_FALLBACK_USER_ID } =
      await import("./internal-user");
    await expect(resolveOrbitOwnerUserId()).resolves.toBe(ORBIT_OWNER_FALLBACK_USER_ID);
  });
});
