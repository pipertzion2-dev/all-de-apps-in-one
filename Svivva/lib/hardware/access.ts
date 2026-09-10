import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAdminAccess } from "@/lib/auth/admin";
import { hasMembershipAccess } from "@/lib/auth/membership-access";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";

export const HARDWARE_ACCESS_DENIED =
  "Sign in, unlock admin, or enter your Pro access code to use Hardware Builder AI features.";

/**
 * Hardware Builder AI routes: admin cookie, membership code, Orbit secret, or signed-in user.
 */
export async function canUseHardwareBuilder(req?: NextRequest): Promise<boolean> {
  if (req && (await isOrbitAdminAllowed(req))) return true;
  if (await hasAdminAccess()) return true;
  if (await hasMembershipAccess()) return true;
  try {
    const user = await getCurrentUser();
    if (user) return true;
  } catch {
    /* no session */
  }
  return false;
}
