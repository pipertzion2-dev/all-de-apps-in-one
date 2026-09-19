import { NextRequest } from "next/server";
import { hasAdminAccess } from "@/lib/auth/admin";

type RequestLike = Pick<NextRequest, "headers"> | Request;

function internalSecretMatches(req?: RequestLike): boolean {
  const expected = process.env.ORBIT_INTERNAL_SECRET?.trim();
  if (!expected || !req) return false;
  const secret = req.headers.get("x-internal-secret")?.trim();
  return !!secret && secret === expected;
}

/** Local dev / custom server schedulers require ORBIT_INTERNAL_SECRET. */
export function isInternalSchedulerConfigured(): boolean {
  return Boolean(process.env.ORBIT_INTERNAL_SECRET?.trim());
}

/**
 * Orbit admin — owner passcode cookie or internal/cron secrets only.
 * Signed-in users (including ADMIN_USER_ID) do NOT bypass the passcode.
 */
export async function isOrbitAdminAllowed(req?: RequestLike): Promise<boolean> {
  if (internalSecretMatches(req)) {
    return true;
  }

  return hasAdminAccess();
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
