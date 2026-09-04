import { describe, expect, it } from "vitest";
import { computeDivvy, simplifySettlements } from "./splits";
import type { ShowAttendee } from "./types";

function attendee(id: string, name: string, paidCents: number, checkedIn = true): ShowAttendee {
  return {
    id,
    name,
    paidCents,
    checkedIn,
    settlementStatus: "pending",
  };
}

describe("computeDivvy", () => {
  it("splits cost evenly and identifies who gives vs receives", () => {
    const attendees = [
      attendee("a", "Alex", 12000),
      attendee("b", "Blake", 0),
      attendee("c", "Casey", 0),
    ];
    const result = computeDivvy(attendees, 12000);
    expect(result.fairShareCents).toBe(4000);
    expect(result.balances.find((b) => b.attendeeId === "a")?.role).toBe("receive");
    expect(result.balances.find((b) => b.attendeeId === "b")?.role).toBe("give");
    expect(result.transfers).toEqual([
      { fromId: "b", fromName: "Blake", toId: "a", toName: "Alex", amountCents: 4000 },
      { fromId: "c", fromName: "Casey", toId: "a", toName: "Alex", amountCents: 4000 },
    ]);
  });

  it("uses only checked-in attendees for the split pool", () => {
    const attendees = [
      attendee("a", "Alex", 6000, true),
      attendee("b", "Blake", 0, false),
      attendee("c", "Casey", 0, true),
    ];
    const result = computeDivvy(attendees, 6000);
    expect(result.checkedInCount).toBe(2);
    expect(result.fairShareCents).toBe(3000);
    expect(result.balances).toHaveLength(2);
  });
});

describe("simplifySettlements", () => {
  it("consolidates multiple debts into minimal transfers", () => {
    const transfers = simplifySettlements([
      {
        attendeeId: "1",
        name: "Host",
        fairShareCents: 2500,
        paidCents: 10000,
        netCents: 7500,
        role: "receive",
      },
      {
        attendeeId: "2",
        name: "Guest A",
        fairShareCents: 2500,
        paidCents: 0,
        netCents: -2500,
        role: "give",
      },
      {
        attendeeId: "3",
        name: "Guest B",
        fairShareCents: 2500,
        paidCents: 2500,
        netCents: 0,
        role: "even",
      },
      {
        attendeeId: "4",
        name: "Guest C",
        fairShareCents: 2500,
        paidCents: 0,
        netCents: -2500,
        role: "give",
      },
    ]);
    expect(transfers).toHaveLength(2);
    expect(transfers.reduce((s, t) => s + t.amountCents, 0)).toBe(5000);
  });
});
