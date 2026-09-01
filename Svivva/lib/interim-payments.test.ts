import { describe, expect, it } from "vitest";
import {
  getCashAppTag,
  isCashAppPlansActive,
  mergeInterimPaymentConfig,
  toPublicInterimPayments,
} from "./interim-payments";

describe("interim-payments / Cash App plans", () => {
  it("defaults Cash App plan links to pipertzion", () => {
    const prevStarter = process.env.INTERIM_CASHAPP_URL_STARTER;
    const prevPro = process.env.INTERIM_CASHAPP_URL_PRO;
    delete process.env.INTERIM_CASHAPP_URL_STARTER;
    delete process.env.INTERIM_CASHAPP_URL_PRO;
    const config = mergeInterimPaymentConfig(null);
    expect(config.cashAppUrlStarter).toBe("https://cash.app/$pipertzion/20");
    expect(config.cashAppUrlPro).toBe("https://cash.app/$pipertzion/50");
    expect(getCashAppTag(config)).toBe("pipertzion");
    if (prevStarter === undefined) delete process.env.INTERIM_CASHAPP_URL_STARTER;
    else process.env.INTERIM_CASHAPP_URL_STARTER = prevStarter;
    if (prevPro === undefined) delete process.env.INTERIM_CASHAPP_URL_PRO;
    else process.env.INTERIM_CASHAPP_URL_PRO = prevPro;
  });

  it("detects active Cash App plans", () => {
    expect(isCashAppPlansActive(mergeInterimPaymentConfig(null))).toBe(true);
    expect(
      isCashAppPlansActive(
        mergeInterimPaymentConfig({ cashAppUrlStarter: "https://cash.app/$x/20" }),
      ),
    ).toBe(true);
  });

  it("public payload includes cashAppTag and note", () => {
    const pub = toPublicInterimPayments(
      mergeInterimPaymentConfig({ cashAppUrlStarter: "https://cash.app/$x/20" }),
    );
    expect(pub.active).toBe(true);
    expect(pub.cashAppPlansActive).toBe(true);
    expect(pub.cashAppTag).toBe("x");
    expect(pub.note).toContain("Cash App");
  });
});
