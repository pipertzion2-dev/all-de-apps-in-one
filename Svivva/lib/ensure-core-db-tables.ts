import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { executeDatabaseDdl } from "@/lib/db-ddl";

let coreTablesEnsured = false;

const SEED_CREDENTIALS_DDL = `
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
`;

const PLATFORM_RUNTIME_SECRETS_DDL = `
  CREATE TABLE IF NOT EXISTS platform_runtime_secrets (
    id TEXT PRIMARY KEY,
    openai_api_key TEXT,
    openai_base_url TEXT,
    stripe_secret_key TEXT,
    stripe_publishable_key TEXT,
    stripe_webhook_secret TEXT,
    next_public_site_url TEXT,
    google_gsc_client_id TEXT,
    google_gsc_client_secret TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

/** Creates GSC/OAuth tables on demand when build migrations did not run (Neon unpooled DDL). */
export async function ensureCoreDbTables(): Promise<void> {
  if (coreTablesEnsured) return;
  await executeDatabaseDdl(SEED_CREDENTIALS_DDL);
  await executeDatabaseDdl(PLATFORM_RUNTIME_SECRETS_DDL);
  coreTablesEnsured = true;
}

/** @deprecated use ensureCoreDbTables */
export async function ensureSeedCredentialsTable(): Promise<void> {
  await ensureCoreDbTables();
}

/** Ensures tables + a seed_credentials row for `userId`. */
export async function ensureSeedCredentialsRow(userId: string): Promise<void> {
  await ensureCoreDbTables();
  const [existing] = await db
    .select({ id: seedCredentials.id })
    .from(seedCredentials)
    .where(eq(seedCredentials.userId, userId))
    .limit(1);
  if (!existing) {
    await db.insert(seedCredentials).values({ userId, updatedAt: new Date() });
  }
}
