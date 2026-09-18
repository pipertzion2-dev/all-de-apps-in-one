import { describe, expect, it } from "vitest";
import { runLocalPromptForge } from "@/lib/tools/local-prompt-forge";

describe("runLocalPromptForge", () => {
  it("returns usable content without a cloud AI key", () => {
    const result = runLocalPromptForge({
      systemPrompt: "You are a concise helper.",
      userMessage: "Write a product tagline for zzai zzai.",
      model: "gpt-4o-mini",
    });

    expect(result.localMode).toBe(true);
    expect(result.costUsd).toBe(0);
    expect(result.content).toMatch(/Local PromptForge mode/i);
    expect(result.content).toMatch(/Improved prompt/i);
    expect(result.model).toContain("local");
    expect(result.totalTokens).toBeGreaterThan(0);
  });
});
