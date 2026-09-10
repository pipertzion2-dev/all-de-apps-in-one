import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/admin", () => ({
  hasAdminAccess: vi.fn(),
}));
vi.mock("@/lib/auth/membership-access", () => ({
  hasMembershipAccess: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: vi.fn(),
}));
vi.mock("@/lib/orbit/admin-access", () => ({
  isOrbitAdminAllowed: vi.fn(),
}));

import { hasAdminAccess } from "@/lib/auth/admin";
import { hasMembershipAccess } from "@/lib/auth/membership-access";
import { getCurrentUser } from "@/lib/auth/session";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { canUseHardwareBuilder } from "./access";

describe("canUseHardwareBuilder", () => {
  beforeEach(() => {
    vi.mocked(hasAdminAccess).mockResolvedValue(false);
    vi.mocked(hasMembershipAccess).mockResolvedValue(false);
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    vi.mocked(isOrbitAdminAllowed).mockResolvedValue(false);
  });

  it("allows admin cookie without OAuth session", async () => {
    vi.mocked(hasAdminAccess).mockResolvedValue(true);
    expect(await canUseHardwareBuilder()).toBe(true);
    expect(getCurrentUser).not.toHaveBeenCalled();
  });

  it("allows membership cookie without OAuth session", async () => {
    vi.mocked(hasMembershipAccess).mockResolvedValue(true);
    expect(await canUseHardwareBuilder()).toBe(true);
  });

  it("allows signed-in user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      firstName: "A",
      lastName: null,
      profileImageUrl: null,
    });
    expect(await canUseHardwareBuilder()).toBe(true);
  });

  it("denies anonymous guest", async () => {
    expect(await canUseHardwareBuilder()).toBe(false);
  });
});
