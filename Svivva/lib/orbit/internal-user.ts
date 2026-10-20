import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { desc, sql } from "drizzle-orm";
import { getPrimaryAdminUserId } from "@/lib/auth/admin";

/** Stable fallback when no env or DB row exists — matches burns-store and marketing credentials. */
export const ORBIT_OWNER_FALLBACK_USER_ID = "orbit-admin";

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
  try {
    const [row] = await db
      .select({ userId: seedCredentials.userId })
      .from(seedCredentials)
      .orderBy(desc(seedCredentials.updatedAt))
      .limit(1);
    return row?.userId ?? null;
  } catch {
    return null;
  }
}

/**
 * Owner id for Burns and other jobs that must always have a user to write against.
 * Falls back to {@link ORBIT_OWNER_FALLBACK_USER_ID} instead of failing the run.
 */
export async function resolveOrbitOwnerUserId(): Promise<string> {
  return (await resolveOrbitInternalUserId()) || ORBIT_OWNER_FALLBACK_USER_ID;
}

/** Ensure a seed_credentials row exists for the owner id (best-effort, never throws). */
export async function ensureOrbitOwnerCredentials(userId: string): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO seed_credentials (id, user_id, updated_at)
      VALUES (${crypto.randomUUID()}, ${userId}, NOW())
      ON CONFLICT (user_id) DO NOTHING
    `);
  } catch {
    /* table may not exist in test env */
  }
}
