import { describe, expect, it } from "vitest";
import { MARKETING_AUTOPILOT_TASKS } from "./marketing-autopilot-tasks";
import { MARKETING_CREDENTIAL_FIELDS } from "./marketing-autopilot-types";
import { maskCredentialsForClient } from "./marketing-autopilot-types";

describe("marketing-autopilot", () => {
  it("defines tasks for every major checklist group", () => {
    const groups = new Set(MARKETING_AUTOPILOT_TASKS.map((t) => t.group));
    expect(groups.has("Technical Foundation")).toBe(true);
    expect(groups.has("Manual Publishing")).toBe(true);
    expect(groups.has("Directories")).toBe(true);
    expect(MARKETING_AUTOPILOT_TASKS.length).toBeGreaterThan(30);
  });

  it("masks secret credential fields", () => {
    const masked = maskCredentialsForClient({
      devtoApiKey: "secret-key-123",
      outreachFromEmail: "hello@svivva.com",
    });
    expect(masked.devtoApiKey).toBe("••••••••");
    expect(masked.outreachFromEmail).toBe("hello@svivva.com");
  });

  it("lists credential fields for UI form", () => {
    expect(MARKETING_CREDENTIAL_FIELDS.some((f) => f.key === "devtoApiKey")).toBe(true);
    expect(MARKETING_CREDENTIAL_FIELDS.some((f) => f.key === "twitterAccessToken")).toBe(true);
  });
});
