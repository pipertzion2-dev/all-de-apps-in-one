import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { getPrimaryAdminUserId } from "@/lib/auth/admin";

/**
 * Orbit internal/cron calls need a `user_id` for `seed_credentials` upserts (IndexNow key, GoDaddy, etc.).
 * Prefer `ADMIN_USER_ID` (site owner) so scheduled jobs use the same row as the paying admin in the UI.
 * Override with `ORBIT_INTERNAL_USER_ID` if jobs must run as a different technical user.
 */
export async function resolveOrbitInternalUserId(): Promise<string | null> {
  const adminId = getPrimaryAdminUserId();
  if (adminId) return adminId;
  const fromEnv = process.env.ORBIT_INTERNAL_USER_ID?.trim();
  if (fromEnv) return fromEnv;
  const [row] = await db
    .select({ userId: seedCredentials.userId })
    .from(seedCredentials)
    .orderBy(desc(seedCredentials.updatedAt))
    .limit(1);
  return row?.userId ?? null;
}
