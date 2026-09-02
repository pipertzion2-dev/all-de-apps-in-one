import { afterEach, describe, expect, it, vi } from "vitest";

describe("getEasyPeasyModel", () => {
  afterEach(() => {
    delete process.env.EASYPEASY_TIER;
    delete process.env.EASYPEASY_MODEL;
    delete process.env.ORBIT_AI_MODEL;
    vi.resetModules();
  });

  it("uses tier model, not ORBIT_AI_MODEL", async () => {
    process.env.EASYPEASY_TIER = "standard";
    process.env.ORBIT_AI_MODEL = "gpt-5";
    const { getEasyPeasyModel } = await import("./runtime");
    expect(getEasyPeasyModel()).toBe("gemini-3-flash");
  });

  it("honors EASYPEASY_MODEL override", async () => {
    process.env.EASYPEASY_TIER = "standard";
    process.env.EASYPEASY_MODEL = "deepseek-v3";
    const { getEasyPeasyModel } = await import("./runtime");
    expect(getEasyPeasyModel()).toBe("deepseek-v3");
  });
});
