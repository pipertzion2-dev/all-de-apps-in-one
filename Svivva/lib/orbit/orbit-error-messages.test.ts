import { describe, expect, it, beforeEach } from "vitest";
import {
  dedupeErrorMessages,
  formatOrbitRunError,
  formatIndexingApiError,
} from "./orbit-error-messages";
import { getOrbitAiAlternatives } from "./orbit-ai-alternatives";

describe("orbit-error-messages", () => {
  it("dedupes repeated Google indexing quota errors", () => {
    const raw =
      "Quota exceeded for quota metric 'Publish requests' and limit 'Publish requests per day' of service 'indexing.googleapis.com' for consumer 'project_number:680989077677'.";
    const out = dedupeErrorMessages([raw, raw]);
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("daily quota");
  });

  it("formats EasyPeasy word limit with alternative providers", () => {
    const hint = formatOrbitRunError(
      "429 You reached the limit of allowed words in your plan. Please upgrade your plan to continue.",
    );
    expect(hint.title).toContain("switch provider");
    expect(hint.actions.length).toBeGreaterThan(0);
  });

  it("explains template fallback when AI is not configured", () => {
    const hint = formatOrbitRunError("No AI provider configured");
    expect(hint.title).toContain("templates");
    expect(hint.detail).toContain("no API key");
  });

  it("formats standard-tier word limit without blaming premium models", () => {
    const hint = formatOrbitRunError("429 You reached the limit of allowed words in your plan.", {
      tierId: "standard",
      model: "gemini-3-flash",
    });
    expect(hint.title).toContain("switch provider");
    expect(hint.detail).not.toContain("gpt-5");
  });

  it("suggests Gemini when EasyPeasy fails to connect", () => {
    const hint = formatOrbitRunError("EasyPeasy connection failed — invalid key");
    expect(hint.title).toContain("EasyPeasy");
    expect(hint.alternatives?.length).toBeGreaterThan(0);
  });

  it("shortens indexing API quota prose", () => {
    expect(formatIndexingApiError("Quota exceeded for Publish requests per day")).toContain(
      "daily quota",
    );
  });
});

describe("orbit-ai-alternatives", () => {
  it("lists Gemini before EasyPeasy", () => {
    const alts = getOrbitAiAlternatives();
    const geminiIdx = alts.findIndex((a) => a.id === "gemini");
    const epIdx = alts.findIndex((a) => a.id === "easypeasy");
    expect(geminiIdx).toBeGreaterThanOrEqual(0);
    expect(epIdx).toBeGreaterThan(geminiIdx);
  });

  it("can exclude a failed provider", () => {
    const alts = getOrbitAiAlternatives(["easypeasy"]);
    expect(alts.some((a) => a.id === "easypeasy")).toBe(false);
  });
});
