import { cookies } from "next/headers";

const MEMBERSHIP_COOKIE = "svivva_membership";

/**
 * Pro membership code. Same reasoning as the admin passcode: /dashboard/settings
 * tells the user to "Enter access code 333 for Pro", so it must work in
 * production rather than falling through to an empty value that rejects
 * everything. Set MEMBERSHIP_ACCESS_CODE to override.
 */
const DEFAULT_MEMBERSHIP_CODE = "333";

function configuredMembershipCode(): string {
  return process.env.MEMBERSHIP_ACCESS_CODE?.trim() || DEFAULT_MEMBERSHIP_CODE;
}

export function verifyMembershipAccessCode(code: string): boolean {
  return code.trim() === configuredMembershipCode();
}

export async function hasMembershipAccess(): Promise<boolean> {
  const store = await cookies();
  return store.get(MEMBERSHIP_COOKIE)?.value === "1";
}

export function membershipAccessCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  };
}

export function membershipAccessCookieName(): string {
  return MEMBERSHIP_COOKIE;
}

export function membershipAccessCookieValue(): string {
  return "1";
}
