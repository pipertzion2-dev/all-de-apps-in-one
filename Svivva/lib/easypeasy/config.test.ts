import { describe, expect, it, afterEach } from "vitest";
import {
  EASYPEASY_BASE_URL,
  isEasyPeasyActive,
  isEasyPeasyBaseUrl,
  mergeEasyPeasyConfig,
} from "./config";

describe("EasyPeasy config", () => {
  afterEach(() => {
    delete process.env.EASYPEASY_API_KEY;
    delete process.env.ORBIT_OPENAI_BASE_URL;
    delete process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    delete process.env.OPENAI_API_KEY;
  });

  it("detects the EasyPeasy base URL", () => {
    expect(isEasyPeasyBaseUrl(EASYPEASY_BASE_URL)).toBe(true);
    expect(isEasyPeasyBaseUrl("https://api.openai.com/v1")).toBe(false);
  });

  it("merges DB key + EasyPeasy base URL as active", () => {
    const config = mergeEasyPeasyConfig({
      apiKey: "ep-test-key",
      baseUrl: EASYPEASY_BASE_URL,
      tierId: "balanced",
    });
    expect(config.tierId).toBe("balanced");
    expect(config.model).toBe("claude-sonnet-4-6");
    expect(isEasyPeasyActive(config)).toBe(true);
    expect(config.apiKey).toBe("ep-test-key");
  });

  it("prefers EASYPEASY_API_KEY from env over DB", () => {
    process.env.EASYPEASY_API_KEY = "env-key";
    const config = mergeEasyPeasyConfig({
      apiKey: "db-key",
      baseUrl: EASYPEASY_BASE_URL,
    });
    expect(config.apiKey).toBe("env-key");
  });

  it("does not treat a plain OpenAI key as EasyPeasy without the base URL", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const config = mergeEasyPeasyConfig({
      apiKey: "sk-test",
      baseUrl: "https://api.openai.com/v1",
    });
    expect(isEasyPeasyActive(config)).toBe(false);
  });
});
