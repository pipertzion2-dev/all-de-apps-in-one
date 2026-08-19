import { describe, expect, it } from "vitest";
import {
  ORBIT_DEFAULT_OPENAI_MODEL,
  getOrbitDefaultModelForProvider,
  getOrbitModelFallbackChain,
} from "./providers";

describe("Orbit OpenAI defaults", () => {
  it("uses gpt-5 as the paid marketing default", () => {
    expect(ORBIT_DEFAULT_OPENAI_MODEL).toBe("gpt-5");
    expect(getOrbitDefaultModelForProvider("openai")).toBe("gpt-5");
  });

  it("falls back through gpt-4o when gpt-5 is unavailable", () => {
    expect(getOrbitModelFallbackChain("openai")).toEqual(["gpt-5", "gpt-4o", "gpt-4o-mini"]);
  });
});
