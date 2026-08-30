import { describe, expect, it } from "vitest";
import { gscOAuthErrorMessage } from "@/lib/gsc-error-messages";

describe("gscOAuthErrorMessage", () => {
  it("maps admin_required", () => {
    expect(gscOAuthErrorMessage("admin_required")).toMatch(/admin passcode/i);
  });

  it("maps Forbidden to admin guidance", () => {
    expect(gscOAuthErrorMessage("Forbidden")).toMatch(/admin/i);
  });
});
