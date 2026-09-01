import { describe, expect, it } from "vitest";
import { verifyAdminAccessCode } from "./admin";
import { verifyMembershipAccessCode } from "./membership-access";

describe("split admin vs membership codes", () => {
  it("admin code does not unlock membership verifier", () => {
    expect(verifyMembershipAccessCode("272727")).toBe(false);
  });

  it("membership code does not unlock admin verifier", () => {
    expect(verifyAdminAccessCode("333")).toBe(false);
  });
});
