import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";

/**
 * Determines if an orbit admin API request should be allowed.
 * Checks in order:
 * 1. x-internal-secret header matches ORBIT_INTERNAL_SECRET (cron/internal calls)
 * 2. Valid user session + isAdmin check (authenticated admin user)
 * 3. If no ADMIN_USER_ID is configured (no auth system available), allow access
 *    — this covers Vercel deployments where Replit OIDC doesn't work
 */
export async function isOrbitAdminAllowed(req?: NextRequest): Promise<boolean> {
  // 1. Internal secret bypass (cron jobs, internal calls)
  if (req) {
    const secret = req.headers.get("x-internal-secret");
    if (secret && secret === process.env.ORBIT_INTERNAL_SECRET) {
      return true;
    }
  }

  // 2. Authenticated user check
  try {
    const user = await getCurrentUser();
    if (user && isAdmin(user)) return true;
  } catch {
    // No session available — continue to fallback
  }

  // 3. No auth provider configured — allow access
  // When ADMIN_USER_ID is not set and Replit OIDC isn't available,
  // there's no way to authenticate, so allow orbit admin access
  const adminUserIds = process.env.ADMIN_USER_ID?.trim();
  if (!adminUserIds) return true;

  return false;
}
