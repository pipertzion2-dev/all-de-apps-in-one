import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAdminAccess } from "@/lib/auth/admin";
import { hasMembershipAccess } from "@/lib/auth/membership-access";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";

/**
 * Hybridization engine access: admin, membership code, Orbit secret, or signed-in user.
 */
export async function canUseHybridizationEngine(req?: NextRequest): Promise<boolean> {
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
