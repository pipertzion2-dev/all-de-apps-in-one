import { describe, expect, it } from "vitest";
import { isEasyPeasyWordLimitError } from "@/lib/orbit/orbit-error-messages";
import { formatTemplateModeNotice } from "@/lib/orbit/easypeasy-skip";

describe("easypeasy-skip", () => {
  it("detects word limit errors", () => {
    expect(isEasyPeasyWordLimitError("429 You reached the limit of allowed words")).toBe(true);
    expect(isEasyPeasyWordLimitError("connection timeout")).toBe(false);
  });

  it("formats a positive template notice when EasyPeasy was the only option", () => {
    const msg = formatTemplateModeNotice(true);
    expect(msg).toMatch(/built-in templates/i);
    expect(msg).toMatch(/Gemini|Cloud Agent/i);
  });
});
