import { describe, expect, it, beforeEach, vi } from "vitest";

vi.mock("@/lib/platform-runtime-secrets", () => ({
  hydratePlatformSecrets: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/easypeasy/ensure", () => ({
  ensureEasyPeasyForOrbit: vi.fn().mockResolvedValue({
    ok: false,
    error: "EasyPeasy word limit reached",
  }),
}));

describe("ensureOrbitAiForRun template fallback", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.EASYPEASY_API_KEY;
    delete process.env.ORBIT_AI_PROVIDER;
    delete process.env.ORBIT_TEMPLATE_MODE;
  });

  it("succeeds with templates when no AI keys are configured", async () => {
    const { ensureOrbitAiForRun } = await import("./ensure-orbit-ai");
    const result = await ensureOrbitAiForRun({ testConnection: false });
    expect(result.ok).toBe(true);
    expect(result.templateMode).toBe(true);
    expect(result.provider).toBe("templates");
    expect(result.providerLabel).toContain("no API key");
  });

  it("falls back to templates when EasyPeasy fails", async () => {
    process.env.EASYPEASY_API_KEY = "ep-broken-key";
    const { ensureOrbitAiForRun } = await import("./ensure-orbit-ai");
    const result = await ensureOrbitAiForRun({ testConnection: true });
    expect(result.ok).toBe(true);
    expect(result.templateMode).toBe(true);
    expect(result.usedFallback).toBe(true);
    expect(result.warning).toBeTruthy();
  });
});
