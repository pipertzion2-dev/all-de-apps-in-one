import { describe, expect, it } from "vitest";
import { buildPaymentLink, zellePayInstructions } from "./payments";

describe("buildPaymentLink", () => {
  it("builds Cash App deep link with amount", () => {
    expect(
      buildPaymentLink({
        profile: { method: "cashapp", handle: "$alex" },
        amountCents: 4050,
        note: "ZZAI Show",
      }),
    ).toBe("https://cash.app/$alex/40.50");
  });

  it("builds Venmo pay link", () => {
    const url = buildPaymentLink({
      profile: { method: "venmo", handle: "@blake" },
      amountCents: 2000,
      note: "Meetup",
    });
    expect(url).toContain("venmo.com");
    expect(url).toContain("amount=20.00");
    expect(url).toContain("recipients=blake");
  });

  it("returns null for Zelle (instructions only)", () => {
    expect(
      buildPaymentLink({
        profile: { method: "zelle", handle: "pay@example.com" },
        amountCents: 1000,
      }),
    ).toBeNull();
  });
});

describe("zellePayInstructions", () => {
  it("formats Zelle copy", () => {
    expect(
      zellePayInstructions({
        profile: { method: "zelle", handle: "pay@example.com" },
        amountCents: 2500,
        note: "Show night",
      }),
    ).toContain("$25.00");
    expect(
      zellePayInstructions({
        profile: { method: "zelle", handle: "pay@example.com" },
        amountCents: 2500,
        note: "Show night",
      }),
    ).toContain("pay@example.com");
  });
});
