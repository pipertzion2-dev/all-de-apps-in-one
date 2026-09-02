import { describe, expect, it, beforeEach } from "vitest";
import { getOrbitActiveAiProvider, isDirectOpenAiConfigured } from "./providers";

describe("Orbit AI provider priority", () => {
  beforeEach(() => {
    delete process.env.ORBIT_AI_PROVIDER;
    delete process.env.EASYPEASY_API_KEY;
    delete process.env.EASYPEASY_TIER;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ORBIT_OPENAI_API_KEY;
    delete process.env.ORBIT_OPENAI_BASE_URL;
    delete process.env.GEMINI_API_KEY;
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
  });

  it("prefers Gemini over EasyPeasy when both are configured", () => {
    process.env.GEMINI_API_KEY = "gemini-test-key-12345";
    process.env.EASYPEASY_API_KEY = "ep-key";
    expect(getOrbitActiveAiProvider()).toBe("gemini");
  });

  it("prefers Gemini over direct OpenAI when both are configured", () => {
    process.env.GEMINI_API_KEY = "gemini-test-key-12345";
    process.env.OPENAI_API_KEY = "sk-test-openai-key";
    expect(getOrbitActiveAiProvider()).toBe("gemini");
  });

  it("uses direct OpenAI when only sk- key is set", () => {
    process.env.OPENAI_API_KEY = "sk-test-openai-key";
    expect(getOrbitActiveAiProvider()).toBe("openai");
    expect(isDirectOpenAiConfigured()).toBe(true);
  });

  it("falls back to EasyPeasy openai route when only EasyPeasy is configured", () => {
    process.env.EASYPEASY_API_KEY = "ep-key";
    expect(getOrbitActiveAiProvider()).toBe("openai");
    expect(isDirectOpenAiConfigured()).toBe(false);
  });

  it("respects ORBIT_AI_PROVIDER=openai override", () => {
    process.env.GEMINI_API_KEY = "gemini-test-key-12345";
    process.env.OPENAI_API_KEY = "sk-test-openai-key";
    process.env.ORBIT_AI_PROVIDER = "openai";
    expect(getOrbitActiveAiProvider()).toBe("openai");
  });
});
