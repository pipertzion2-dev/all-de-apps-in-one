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

/** Marketing hub tables (UTM / referrals / campaigns) — Orbit Acquire needs these. */
const MARKETING_CAMPAIGNS_DDL = `
  CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    channel TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    budget REAL,
    spent REAL DEFAULT 0,
    target_audience TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    goals JSONB,
    metrics JSONB DEFAULT '{"clicks":0,"impressions":0,"conversions":0,"leads":0,"revenue":0}'::jsonb,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
`;

const MARKETING_LEADS_DDL = `
  CREATE TABLE IF NOT EXISTS marketing_leads (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    company TEXT,
    phone TEXT,
    source TEXT,
    campaign_id TEXT,
    score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'new',
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    metadata JSONB,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`;

const MARKETING_REFERRALS_DDL = `
  CREATE TABLE IF NOT EXISTS marketing_referrals (
    id TEXT PRIMARY KEY,
    referrer_id TEXT NOT NULL,
    referrer_email TEXT NOT NULL,
    referral_code TEXT NOT NULL UNIQUE,
    referral_link TEXT NOT NULL,
    clicks INTEGER DEFAULT 0,
    signups INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    reward_type TEXT DEFAULT 'credit',
    reward_amount REAL DEFAULT 0,
    reward_paid BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`;

const MARKETING_REFERRAL_EVENTS_DDL = `
  CREATE TABLE IF NOT EXISTS marketing_referral_events (
    id TEXT PRIMARY KEY,
    referral_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    referred_email TEXT,
    ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`;

const MARKETING_UTM_LINKS_DDL = `
  CREATE TABLE IF NOT EXISTS marketing_utm_links (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    destination_url TEXT NOT NULL,
    utm_source TEXT NOT NULL,
    utm_medium TEXT NOT NULL,
    utm_campaign TEXT NOT NULL,
    utm_term TEXT,
    utm_content TEXT,
    short_code TEXT UNIQUE,
    clicks INTEGER DEFAULT 0,
    campaign_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`;

const MARKETING_AB_TESTS_DDL = `
  CREATE TABLE IF NOT EXISTS marketing_ab_tests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    hypothesis TEXT,
    status TEXT DEFAULT 'draft',
    winner_variant TEXT,
    target_metric TEXT NOT NULL DEFAULT 'conversion_rate',
    variants JSONB DEFAULT '[]'::jsonb,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
`;

const MARKETING_AMPLIFY_JOBS_DDL = `
  CREATE TABLE IF NOT EXISTS marketing_amplify_jobs (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL,
    source_id TEXT,
    source_content TEXT,
    outputs JSONB DEFAULT '[]'::jsonb,
    channels TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`;

/** SEO/blog/growth + marketing hub tables Orbit Run All needs when drizzle push did not run on deploy. */
export async function ensureMarketingContentTables(): Promise<void> {
  if (marketingTablesEnsured) return;
  await executeDatabaseDdl(SEO_LANDING_PAGES_DDL);
  await executeDatabaseDdl(BLOG_POSTS_DDL);
  await executeDatabaseDdl(GROWTH_SUBMISSIONS_DDL);
  await executeDatabaseDdl(GROWTH_CONTENT_DDL);
  await executeDatabaseDdl(GROWTH_TASKS_DDL);
  await executeDatabaseDdl(MARKETING_CAMPAIGNS_DDL);
  await executeDatabaseDdl(MARKETING_LEADS_DDL);
  await executeDatabaseDdl(MARKETING_REFERRALS_DDL);
  await executeDatabaseDdl(MARKETING_REFERRAL_EVENTS_DDL);
  await executeDatabaseDdl(MARKETING_UTM_LINKS_DDL);
  await executeDatabaseDdl(MARKETING_AB_TESTS_DDL);
  await executeDatabaseDdl(MARKETING_AMPLIFY_JOBS_DDL);
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
