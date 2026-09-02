import { afterEach, describe, expect, it, vi } from "vitest";

describe("getMarketingModel with EasyPeasy", () => {
  afterEach(() => {
    delete process.env.EASYPEASY_API_KEY;
    delete process.env.EASYPEASY_TIER;
    delete process.env.EASYPEASY_MODEL;
    delete process.env.ORBIT_AI_MODEL;
    delete process.env.OPENAI_API_KEY;
    delete process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    vi.resetModules();
  });

  it("ignores ORBIT_AI_MODEL when EasyPeasy gateway is configured", async () => {
    process.env.EASYPEASY_API_KEY = "ep-key";
    process.env.EASYPEASY_TIER = "standard";
    process.env.ORBIT_AI_MODEL = "gpt-5";
    const { getMarketingModel } = await import("./ai-client");
    expect(getMarketingModel()).toBe("gemini-3-flash");
  });

  it("uses ORBIT_AI_MODEL for direct OpenAI (no EasyPeasy)", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.ORBIT_AI_MODEL = "gpt-5";
    const { getMarketingModel } = await import("./ai-client");
    expect(getMarketingModel()).toBe("gpt-5");
  });
});
