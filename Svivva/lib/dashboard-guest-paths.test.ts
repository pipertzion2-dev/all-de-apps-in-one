import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { isAdminCodeFirstPath, isDashboardGuestPath } from "@/lib/dashboard-guest-paths";

describe("dashboard guest paths", () => {
  it("allows Burns and GSC without session (admin code first)", () => {
    expect(isAdminCodeFirstPath("/dashboard/burns")).toBe(true);
    expect(isAdminCodeFirstPath("/dashboard/gsc-connect")).toBe(true);
    expect(isDashboardGuestPath("/dashboard/burns")).toBe(true);
  });

  it("allows public Orbit and launchpad without session", () => {
    expect(isDashboardGuestPath("/dashboard/orbit")).toBe(true);
    expect(isDashboardGuestPath("/dashboard/launchpad")).toBe(true);
  });
});

describe("dashboard middleware", () => {
  it("does not redirect /dashboard to /login (admin code gate lives in layout)", () => {
    const src = readFileSync(resolve(__dirname, "../middleware.ts"), "utf8");
    expect(src).not.toMatch(/new URL\("\/login".*dashboard/s);
    expect(src).toContain("dashboard-layout-client");
  });
});
