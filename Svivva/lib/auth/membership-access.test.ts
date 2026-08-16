import { describe, expect, it } from "vitest";
import {
  MEMBERSHIP_ACCESS_CODE,
  verifyMembershipAccessCode,
} from "./membership-access";

describe("membership access code", () => {
  it("accepts 333", () => {
    expect(MEMBERSHIP_ACCESS_CODE).toBe("333");
    expect(verifyMembershipAccessCode("333")).toBe(true);
    expect(verifyMembershipAccessCode(" 333 ")).toBe(true);
  });

  it("rejects other codes", () => {
    expect(verifyMembershipAccessCode("272727")).toBe(false);
    expect(verifyMembershipAccessCode("")).toBe(false);
    expect(verifyMembershipAccessCode("334")).toBe(false);
  });
});
