import { afterEach, describe, expect, it, vi } from "vitest";

const getPlatformRuntimeSecretsRow = vi.fn(async () => null);
const patchPlatformRuntimeSecrets = vi.fn(async () => {});

vi.mock("@/lib/platform-runtime-secrets", () => ({
  hydratePlatformSecrets: vi.fn(async () => {}),
  patchPlatformRuntimeSecrets,
  getPlatformRuntimeSecretsRow,
}));

vi.mock("@/lib/easypeasy/client", () => ({
  testEasyPeasyConnection: vi.fn(async () => ({ ok: true, model: "gemini-3-flash", reply: "OK" })),
}));

describe("ensureEasyPeasyForOrbit", () => {
  afterEach(() => {
    delete process.env.EASYPEASY_API_KEY;
    delete process.env.EASYPEASY_TIER;
    vi.clearAllMocks();
    getPlatformRuntimeSecretsRow.mockResolvedValue(null);
  });

  it("returns error when no key is configured", async () => {
    const { ensureEasyPeasyForOrbit } = await import("./ensure");
    const result = await ensureEasyPeasyForOrbit({ testConnection: false });
    expect(result.ok).toBe(false);
    expect(result.active).toBe(false);
  });

  it("activates from EASYPEASY_API_KEY env on standard tier", async () => {
    process.env.EASYPEASY_API_KEY = "test-key";
    const { ensureEasyPeasyForOrbit } = await import("./ensure");
    const result = await ensureEasyPeasyForOrbit({
      tierId: "standard",
      forceTier: true,
      testConnection: false,
    });
    expect(patchPlatformRuntimeSecrets).toHaveBeenCalled();
    expect(result.active).toBe(true);
    expect(result.tierId).toBe("standard");
  });

  it("migrates stored premium tier to standard", async () => {
    getPlatformRuntimeSecretsRow.mockResolvedValue({
      openaiApiKey: "test-key",
      openaiBaseUrl: "https://easy-peasy.ai/api",
      easypeasyTier: "premium",
    });
    const { migrateStoredPremiumTierIfNeeded } = await import("./ensure");
    const result = await migrateStoredPremiumTierIfNeeded();
    expect(patchPlatformRuntimeSecrets).toHaveBeenCalledWith(
      expect.objectContaining({ easypeasyTier: "standard" }),
    );
    expect(result.migrated).toBe(true);
    expect(result.tierId).toBe("standard");
  });

  it("migrates stored premium tier to standard via ensure", async () => {
    process.env.EASYPEASY_API_KEY = "test-key";
    getPlatformRuntimeSecretsRow.mockResolvedValue({
      openaiApiKey: "test-key",
      openaiBaseUrl: "https://easy-peasy.ai/api",
      easypeasyTier: "premium",
    });
    const { ensureEasyPeasyForOrbit } = await import("./ensure");
    const result = await ensureEasyPeasyForOrbit({ testConnection: false });
    expect(patchPlatformRuntimeSecrets).toHaveBeenCalledWith(
      expect.objectContaining({ easypeasyTier: "standard" }),
    );
    expect(result.tierId).toBe("standard");
  });
});
