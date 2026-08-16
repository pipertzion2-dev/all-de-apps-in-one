import { cookies } from "next/headers";

/**
 * Owner/membership bypass — enter on Settings or Billing instead of a paid plan.
 * Unlocks Pro features for both digital and hardware modes.
 */
export const MEMBERSHIP_ACCESS_CODE = "333";

const MEMBERSHIP_COOKIE = "svivva_membership";

export function verifyMembershipAccessCode(code: string): boolean {
  return code.trim() === MEMBERSHIP_ACCESS_CODE;
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
