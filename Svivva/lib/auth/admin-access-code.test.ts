import { afterEach, describe, expect, it } from "vitest";
import { verifyAdminAccessCode } from "./admin";
import { verifyMembershipAccessCode } from "./membership-access";

const originalNodeEnv = process.env.NODE_ENV;
const originalAdminCode = process.env.ADMIN_ACCESS_CODE;
const originalMembershipCode = process.env.MEMBERSHIP_ACCESS_CODE;

function setNodeEnv(value: string | undefined) {
  // NODE_ENV is readonly in the Next types but writable at runtime.
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

afterEach(() => {
  setNodeEnv(originalNodeEnv);
  if (originalAdminCode === undefined) delete process.env.ADMIN_ACCESS_CODE;
  else process.env.ADMIN_ACCESS_CODE = originalAdminCode;
  if (originalMembershipCode === undefined) delete process.env.MEMBERSHIP_ACCESS_CODE;
  else process.env.MEMBERSHIP_ACCESS_CODE = originalMembershipCode;
});

describe("orbit admin access code", () => {
  it("accepts 272727", () => {
    expect(verifyAdminAccessCode("272727")).toBe(true);
    expect(verifyAdminAccessCode(" 272727 ")).toBe(true);
  });

  it("accepts 272727 in production", () => {
    // Regression: production returned an empty expected code, so every attempt
    // failed with "Incorrect code" and the Orbit gate could not be opened even
    // UI must not print passcodes; verification stays server-side.
    setNodeEnv("production");
    delete process.env.ADMIN_ACCESS_CODE;
    expect(verifyAdminAccessCode("272727")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(verifyAdminAccessCode("")).toBe(false);
    expect(verifyAdminAccessCode("   ")).toBe(false);
    expect(verifyAdminAccessCode("272728")).toBe(false);
    expect(verifyAdminAccessCode("333")).toBe(false);
  });

  it("lets ADMIN_ACCESS_CODE override the default", () => {
    process.env.ADMIN_ACCESS_CODE = "s3cret-code";
    expect(verifyAdminAccessCode("s3cret-code")).toBe(true);
    expect(verifyAdminAccessCode("272727")).toBe(false);
  });

  it("falls back to the default when the override is blank", () => {
    process.env.ADMIN_ACCESS_CODE = "   ";
    expect(verifyAdminAccessCode("272727")).toBe(true);
  });
});

describe("pro membership access code", () => {
  it("accepts 333 in production", () => {
    setNodeEnv("production");
    delete process.env.MEMBERSHIP_ACCESS_CODE;
    expect(verifyMembershipAccessCode("333")).toBe(true);
  });

  it("stays distinct from the admin code", () => {
    expect(verifyMembershipAccessCode("272727")).toBe(false);
    expect(verifyAdminAccessCode("333")).toBe(false);
  });

  it("lets MEMBERSHIP_ACCESS_CODE override the default", () => {
    process.env.MEMBERSHIP_ACCESS_CODE = "pro-only";
    expect(verifyMembershipAccessCode("pro-only")).toBe(true);
    expect(verifyMembershipAccessCode("333")).toBe(false);
  });
});
