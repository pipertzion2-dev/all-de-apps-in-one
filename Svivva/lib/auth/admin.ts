import { cookies } from "next/headers";
import type { SessionUser } from "./session";
import { siteCookieDomain } from "@/lib/site-cookie-domain";

const ADMIN_COOKIE = "svivva_admin";

/**
 * Owner Orbit admin passcode. Set ADMIN_ACCESS_CODE in production (Vercel env).
 * Never shown in public UI — unlock at /admin only.
 */
const DEFAULT_ADMIN_CODE = "272727";

function configuredAdminCode(): string {
  return process.env.ADMIN_ACCESS_CODE?.trim() || DEFAULT_ADMIN_CODE;
}

export function verifyAdminAccessCode(code: string): boolean {
  return code.trim() === configuredAdminCode();
}

export async function hasAdminAccess(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === "1";
}

/** Cookie set by POST /api/auth/admin-code when passcode matches. */
export function adminAccessCookieOptions() {
  const domain = siteCookieDomain();
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    ...(domain ? { domain } : {}),
  };
}

export function adminAccessCookieName(): string {
  return ADMIN_COOKIE;
}

export function adminAccessCookieValue(): string {
  return "1";
}

/** Legacy sync API — use hasAdminAccess() on the server instead. */
export function isAdmin(_user: SessionUser | null): boolean {
  return false;
}

export function requireAdmin(_user: SessionUser | null): boolean {
  return false;
}

export function getPrimaryAdminUserId(): string | null {
  const raw = process.env.ADMIN_USER_ID?.trim();
  if (!raw) return null;
  return raw.split(",")[0]?.trim() || null;
}
