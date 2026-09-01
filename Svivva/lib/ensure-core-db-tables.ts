import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { executeDatabaseDdl } from "@/lib/db-ddl";

let coreTablesEnsured = false;
let marketingTablesEnsured = false;

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

const SEO_LANDING_PAGES_DDL = `
  CREATE TABLE IF NOT EXISTS seo_landing_pages (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    keyword TEXT NOT NULL,
    title TEXT NOT NULL,
    headline TEXT NOT NULL,
    subheadline TEXT,
    content TEXT NOT NULL,
    benefits TEXT[] NOT NULL DEFAULT '{}',
    how_it_works TEXT NOT NULL,
    whos_it_for TEXT NOT NULL,
    related_slugs TEXT[] NOT NULL DEFAULT '{}',
    category TEXT NOT NULL DEFAULT 'general',
    tool_url TEXT,
    meta_title TEXT,
    meta_description TEXT,
    published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

const BLOG_POSTS_DDL = `
  CREATE TABLE IF NOT EXISTS blog_posts (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'ZZAI Team',
    category TEXT NOT NULL DEFAULT 'general',
    tags TEXT[] NOT NULL DEFAULT '{}',
    meta_title TEXT,
    meta_description TEXT,
    og_image TEXT,
    published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

const GROWTH_SUBMISSIONS_DDL = `
  CREATE TABLE IF NOT EXISTS growth_submissions (
    id TEXT PRIMARY KEY,
    directory_id TEXT NOT NULL,
    product TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMPTZ,
    live_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

const GROWTH_CONTENT_DDL = `
  CREATE TABLE IF NOT EXISTS growth_content (
    id TEXT PRIMARY KEY,
    product TEXT NOT NULL,
    content_type TEXT NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

const GROWTH_TASKS_DDL = `
  CREATE TABLE IF NOT EXISTS growth_tasks (
    id TEXT PRIMARY KEY,
    task_type TEXT NOT NULL,
    product TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    details JSONB,
    run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

/** SEO/blog/growth tables Orbit Run All needs when drizzle push did not run on deploy. */
export async function ensureMarketingContentTables(): Promise<void> {
  if (marketingTablesEnsured) return;
  await executeDatabaseDdl(SEO_LANDING_PAGES_DDL);
  await executeDatabaseDdl(BLOG_POSTS_DDL);
  await executeDatabaseDdl(GROWTH_SUBMISSIONS_DDL);
  await executeDatabaseDdl(GROWTH_CONTENT_DDL);
  await executeDatabaseDdl(GROWTH_TASKS_DDL);
  marketingTablesEnsured = true;
}

/** GSC credentials + Orbit marketing content tables. */
export async function ensureOrbitDbReady(): Promise<void> {
  await ensureCoreDbTables();
  await ensureMarketingContentTables();
}

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
