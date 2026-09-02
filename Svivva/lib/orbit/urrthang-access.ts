import type { NextRequest } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";

/** urrthang / marketing autopilot — owner (Orbit admin) or internal cron only. */
export async function canRunUrrthang(req?: NextRequest): Promise<boolean> {
  return isOrbitAdminAllowed(req);
}
