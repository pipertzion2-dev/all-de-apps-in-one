import { describe, expect, it } from "vitest";
import {
  buildGuestEventMessage,
  decodeInvitePayload,
  encodeInvitePayload,
  type GuestInvitePayload,
} from "./share";

const sample: GuestInvitePayload = {
  v: 1,
  eventId: "show_1",
  guestId: "att_1",
  title: "ZZAI Live",
  eventDate: "2026-09-04",
  venue: "Studio",
  guestName: "Blake",
  fairShareCents: 4000,
  paidCents: 0,
  owesCents: 4000,
  payToName: "Alex",
  payToHandle: "alex",
  payMethod: "cashapp",
  transferAmountCents: 4000,
};

describe("invite payload codec", () => {
  it("round-trips encode/decode", () => {
    const encoded = encodeInvitePayload(sample);
    const decoded = decodeInvitePayload(encoded);
    expect(decoded?.guestName).toBe("Blake");
    expect(decoded?.transferAmountCents).toBe(4000);
  });
});

describe("buildGuestEventMessage", () => {
  it("includes event and payment details", () => {
    const msg = buildGuestEventMessage(sample);
    expect(msg).toContain("ZZAI Live");
    expect(msg).toContain("$40.00");
    expect(msg).toContain("Alex");
  });
});
