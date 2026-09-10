import { afterEach, describe, expect, it, vi } from "vitest";
import { getHardwareProviderAttempts } from "./ai-client";

describe("getHardwareProviderAttempts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers Gemini before EasyPeasy when both are configured", () => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key-1234567890");
    vi.stubEnv("OPENAI_API_KEY", "ep-test-key-not-sk");
    vi.stubEnv("AI_INTEGRATIONS_OPENAI_BASE_URL", "https://easy-peasy.ai/api");
    vi.stubEnv("EASYPEASY_API_KEY", "ep-test-key-not-sk");

    const attempts = getHardwareProviderAttempts();
    expect(attempts.length).toBeGreaterThanOrEqual(2);
    expect(attempts[0]?.id).toBe("gemini");
    expect(attempts.some((a) => a.id === "easypeasy")).toBe(true);
  });

  it("uses direct OpenAI before EasyPeasy gateway", () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "sk-direct-openai-test-key-1234567890");
    vi.stubEnv("AI_INTEGRATIONS_OPENAI_BASE_URL", "");

    const attempts = getHardwareProviderAttempts();
    expect(attempts[0]?.id).toBe("openai");
    expect(attempts[0]?.label).toBe("OpenAI");
  });
});
