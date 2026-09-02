import { describe, expect, it, vi } from "vitest";
import { hasMembershipAccess } from "@/lib/auth/membership-access";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { canRunUrrthang } from "./urrthang-access";

describe("canRunUrrthang", () => {
  it("delegates to Orbit admin only", async () => {
    const adminSpy = vi.spyOn(await import("@/lib/orbit/admin-access"), "isOrbitAdminAllowed");
    adminSpy.mockResolvedValueOnce(true);
    await expect(canRunUrrthang()).resolves.toBe(true);
    adminSpy.mockRestore();
  });
});

describe("membership vs urrthang", () => {
  it("exports separate access helpers", () => {
    expect(typeof hasMembershipAccess).toBe("function");
    expect(typeof isOrbitAdminAllowed).toBe("function");
    expect(typeof canRunUrrthang).toBe("function");
  });
});
