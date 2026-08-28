import { cookies } from "next/headers";

const MEMBERSHIP_COOKIE = "svivva_membership";

function configuredMembershipCode(): string {
  const fromEnv = process.env.MEMBERSHIP_ACCESS_CODE?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV !== "production") return "333";
  return "";
}

export function verifyMembershipAccessCode(code: string): boolean {
  const expected = configuredMembershipCode();
  if (!expected) return false;
  return code.trim() === expected;
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
