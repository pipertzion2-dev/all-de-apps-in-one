import { describe, expect, it } from "vitest";
import { gscOAuthErrorMessage } from "@/lib/gsc-error-messages";

describe("gscOAuthErrorMessage", () => {
  it("maps admin_required", () => {
    expect(gscOAuthErrorMessage("admin_required")).toMatch(/admin passcode/i);
  });

  it("maps Forbidden to admin guidance", () => {
    expect(gscOAuthErrorMessage("Forbidden")).toMatch(/admin/i);
  });

  it("maps Safari JSON parse noise to actionable guidance", () => {
    expect(gscOAuthErrorMessage("The string did not match the expected pattern.")).toMatch(
      /Safari/i,
    );
  });
});
