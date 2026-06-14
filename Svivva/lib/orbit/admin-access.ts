import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAdminAccess } from "@/lib/auth/admin";

/**
 * Determines if an orbit admin API request should be allowed.
 * Checks in order:
 * 1. x-internal-secret header matches ORBIT_INTERNAL_SECRET (cron/internal calls)
 * 2. Admin passcode cookie (272727 via /api/auth/admin-code)
 */
export async function isOrbitAdminAllowed(req?: NextRequest): Promise<boolean> {
  if (req) {
    const secret = req.headers.get("x-internal-secret");
    if (secret && secret === process.env.ORBIT_INTERNAL_SECRET) {
      return true;
    }
  }

  if (await hasAdminAccess()) return true;

  try {
    await getCurrentUser();
  } catch {
    /* no session */
  }

  return false;
}

/** Cron jobs and internal schedulers. */
export function isInternalSecretAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get("x-internal-secret");
  return !!secret && secret === process.env.ORBIT_INTERNAL_SECRET;
}

/** Health checks and ops probes with CRON_SECRET bearer token. */
export function isCronSecretAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return false;
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  return auth.slice(7) === expected;
}
