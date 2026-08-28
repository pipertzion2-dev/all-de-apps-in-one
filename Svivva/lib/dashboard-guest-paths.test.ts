import { describe, expect, it } from "vitest";
import { isAdminCodeFirstPath, isDashboardGuestPath } from "@/lib/dashboard-guest-paths";

describe("dashboard guest paths", () => {
  it("allows Burns and GSC without session (admin code first)", () => {
    expect(isAdminCodeFirstPath("/dashboard/burns")).toBe(true);
    expect(isAdminCodeFirstPath("/dashboard/gsc-connect")).toBe(true);
    expect(isDashboardGuestPath("/dashboard/burns")).toBe(true);
  });

  it("still blocks generic dashboard routes for middleware", () => {
    expect(isDashboardGuestPath("/dashboard")).toBe(false);
    expect(isDashboardGuestPath("/dashboard/settings")).toBe(false);
    expect(isDashboardGuestPath("/dashboard/projects")).toBe(false);
  });

  it("allows public Orbit and launchpad without session", () => {
    expect(isDashboardGuestPath("/dashboard/orbit")).toBe(true);
    expect(isDashboardGuestPath("/dashboard/launchpad")).toBe(true);
  });
});
