import { describe, expect, it } from "vitest";
import { getMembershipUnlockInfo } from "./membership-unlock";

describe("getMembershipUnlockInfo", () => {
  it("returns instructions and the configured access code", () => {
    const prev = process.env.MEMBERSHIP_ACCESS_CODE;
    delete process.env.MEMBERSHIP_ACCESS_CODE;
    const info = getMembershipUnlockInfo();
    expect(info.instructions).toMatch(/Cash App/i);
    expect(info.instructions).toMatch(/urrthang/i);
    expect(info.code).toBe("333");
    if (prev === undefined) delete process.env.MEMBERSHIP_ACCESS_CODE;
    else process.env.MEMBERSHIP_ACCESS_CODE = prev;
  });
});
