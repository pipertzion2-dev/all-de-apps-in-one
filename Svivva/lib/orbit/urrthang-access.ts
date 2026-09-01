import type { NextRequest } from "next/server";
import { hasMembershipAccess } from "@/lib/auth/membership-access";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";

/** urrthang / marketing autopilot — admin, membership code (after Cash App pay), or internal cron. */
export async function canRunUrrthang(req?: NextRequest): Promise<boolean> {
  if (await isOrbitAdminAllowed(req)) return true;
  if (await hasMembershipAccess()) return true;
  return false;
}
