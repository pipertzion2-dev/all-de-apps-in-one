import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/platform-runtime-secrets", () => ({
  hydratePlatformSecrets: vi.fn(async () => {}),
  patchPlatformRuntimeSecrets: vi.fn(async () => {}),
  getPlatformRuntimeSecretsRow: vi.fn(async () => null),
}));

vi.mock("@/lib/easypeasy/client", () => ({
  testEasyPeasyConnection: vi.fn(async () => ({ ok: true, model: "gemini-3-flash", reply: "OK" })),
}));

describe("ensureEasyPeasyForOrbit", () => {
  afterEach(() => {
    delete process.env.EASYPEASY_API_KEY;
    delete process.env.EASYPEASY_TIER;
    vi.clearAllMocks();
  });

  it("returns error when no key is configured", async () => {
    const { ensureEasyPeasyForOrbit } = await import("./ensure");
    const result = await ensureEasyPeasyForOrbit({ testConnection: false });
    expect(result.ok).toBe(false);
    expect(result.active).toBe(false);
  });

  it("activates from EASYPEASY_API_KEY env", async () => {
    process.env.EASYPEASY_API_KEY = "test-key";
    const { patchPlatformRuntimeSecrets } = await import("@/lib/platform-runtime-secrets");
    const { ensureEasyPeasyForOrbit } = await import("./ensure");
    const result = await ensureEasyPeasyForOrbit({
      tierId: "premium",
      forceTier: true,
      testConnection: false,
    });
    expect(patchPlatformRuntimeSecrets).toHaveBeenCalled();
    expect(result.active).toBe(true);
    expect(result.tierId).toBe("premium");
  });
});
