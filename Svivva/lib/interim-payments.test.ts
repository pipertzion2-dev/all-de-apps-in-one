import { describe, expect, it } from "vitest";
import {
  isDirectPayActive,
  isInterimPaymentActive,
  mergeInterimPaymentConfig,
  toPublicInterimPayments,
} from "./interim-payments";

describe("interim-payments", () => {
  it("merges db venmo over env", () => {
    const prev = process.env.INTERIM_VENMO_URL;
    process.env.INTERIM_VENMO_URL = "https://venmo.com/u/env";
    const config = mergeInterimPaymentConfig({
      venmoUrlPro: "https://venmo.com/u/pro",
      venmoUrl: null,
    });
    expect(config.venmoUrlStarter).toBe("https://venmo.com/u/env");
    expect(config.venmoUrlPro).toBe("https://venmo.com/u/pro");
    if (prev === undefined) delete process.env.INTERIM_VENMO_URL;
    else process.env.INTERIM_VENMO_URL = prev;
  });

  it("detects active when direct pay exists", () => {
    expect(isInterimPaymentActive(mergeInterimPaymentConfig(null))).toBe(false);
    expect(
      isDirectPayActive(mergeInterimPaymentConfig({ venmoUrlStarter: "https://venmo.com/u/x" })),
    ).toBe(true);
  });

  it("public payload includes default note", () => {
    const pub = toPublicInterimPayments(
      mergeInterimPaymentConfig({ venmoUrlStarter: "https://venmo.com/u/x" }),
    );
    expect(pub.active).toBe(true);
    expect(pub.directPayActive).toBe(true);
    expect(pub.note).toContain("hello@zzaizzai.com");
  });
});
