import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

let seedCredentialsTableEnsured = false;

/** Creates `seed_credentials` on demand when Vercel build migrations did not run. */
export async function ensureSeedCredentialsTable(): Promise<void> {
  if (seedCredentialsTableEnsured) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS seed_credentials (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        replit_token TEXT,
        replit_username TEXT,
        godaddy_api_key TEXT,
        godaddy_api_secret TEXT,
        godaddy_domain TEXT,
        google_site_url TEXT,
        google_verification_token TEXT,
        custom_domain TEXT,
        domain_token TEXT,
        domain_verified BOOLEAN DEFAULT false,
        indexnow_key TEXT,
        google_service_account_json TEXT,
        google_oauth_refresh_token TEXT,
        google_oauth_email TEXT,
        google_indexing_enabled BOOLEAN DEFAULT false,
        last_indexnow_submit TIMESTAMPTZ,
        last_google_indexing TIMESTAMPTZ,
        mini_apps_url TEXT,
        mini_apps_subdomain TEXT,
        marketing_autopilot_credentials TEXT,
        marketing_autopilot_last_run TEXT,
        burns_runs TEXT,
        burns_progress TEXT,
        orbit_admin_state TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    seedCredentialsTableEnsured = true;
  } catch {
    /* test env without Postgres */
  }
}

/** Ensures table + a row for `userId` (used before OAuth save / GSC updates). */
export async function ensureSeedCredentialsRow(userId: string): Promise<void> {
  await ensureSeedCredentialsTable();
  try {
    const [existing] = await db
      .select({ id: seedCredentials.id })
      .from(seedCredentials)
      .where(eq(seedCredentials.userId, userId))
      .limit(1);
    if (!existing) {
      await db.insert(seedCredentials).values({ userId, updatedAt: new Date() });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/relation .*seed_credentials.* does not exist/i.test(msg)) {
      seedCredentialsTableEnsured = false;
      await ensureSeedCredentialsTable();
      await db.insert(seedCredentials).values({ userId, updatedAt: new Date() });
      return;
    }
    throw e;
  }
}
