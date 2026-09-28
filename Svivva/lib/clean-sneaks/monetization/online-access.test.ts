import { describe, expect, it } from "vitest";
import { canStartOnlineTable, normalizeGamerTag, utcMonthKey } from "./online-access";
import { hasUnlimitedKleanOnline, kleanOnlineMonthlyLimit } from "@/lib/billing/resolve-user-plan";

describe("klean online access", () => {
  it("uses UTC month keys", () => {
    expect(utcMonthKey(new Date("2026-09-28T12:00:00Z"))).toBe("2026-09");
  });

  it("allows tables under the monthly cap", () => {
    expect(canStartOnlineTable(0, 2).ok).toBe(true);
    expect(canStartOnlineTable(1, 2).ok).toBe(true);
    expect(canStartOnlineTable(2, 2).ok).toBe(false);
  });

  it("treats unlimited as zero limit sentinel", () => {
    expect(canStartOnlineTable(999, 0).ok).toBe(true);
    expect(kleanOnlineMonthlyLimit(true, true)).toBe(0);
  });

  it("grants unlimited online for any active subscription row", () => {
    expect(hasUnlimitedKleanOnline({ stripeSubscriptionId: "sub_123" })).toBe(true);
    expect(hasUnlimitedKleanOnline(null)).toBe(false);
  });

  it("validates gamer tags", () => {
    expect(normalizeGamerTag("ab")).toBeNull();
    expect(normalizeGamerTag("Klean_Runner")).toBe("Klean_Runner");
    expect(normalizeGamerTag("bad tag!")).toBeNull();
  });
});
