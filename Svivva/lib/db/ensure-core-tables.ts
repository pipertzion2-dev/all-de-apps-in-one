import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * Runtime schema bootstrap for Vercel production when DATABASE_URL is set at
 * runtime but drizzle-kit push did not run during build (common when the URL
 * is only in the Production env, not Build env).
 */
let coreReady: Promise<void> | null = null;

export async function ensureCoreTables(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      "DATABASE_URL is not configured. Add a Postgres connection string in Vercel → Settings → Environment Variables (Production), then redeploy.",
    );
  }

  if (!coreReady) {
    coreReady = (async () => {
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE,
          name TEXT,
          avatar_url TEXT,
          password_hash TEXT,
          stripe_customer_id TEXT,
          stripe_subscription_id TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS seed_credentials (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
          domain_verified BOOLEAN DEFAULT FALSE,
          indexnow_key TEXT,
          google_service_account_json TEXT,
          google_oauth_refresh_token TEXT,
          google_oauth_email TEXT,
          google_indexing_enabled BOOLEAN DEFAULT FALSE,
          last_indexnow_submit TIMESTAMP,
          last_google_indexing TIMESTAMP,
          mini_apps_url TEXT,
          mini_apps_subdomain TEXT,
          marketing_autopilot_credentials TEXT,
          marketing_autopilot_last_run TEXT,
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS oauth_states (
          state TEXT PRIMARY KEY,
          code_verifier TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          redirect_after TEXT,
          callback_base TEXT
        )
      `);

      await db.execute(sql`
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
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS seo_landing_pages (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
          published BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS blog_posts (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
          published BOOLEAN NOT NULL DEFAULT FALSE,
          published_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      // Idempotent column adds for rows created before newer migrations.
      await db.execute(
        sql`ALTER TABLE seed_credentials ADD COLUMN IF NOT EXISTS google_oauth_refresh_token TEXT`,
      );
      await db.execute(
        sql`ALTER TABLE seed_credentials ADD COLUMN IF NOT EXISTS google_oauth_email TEXT`,
      );
      await db.execute(
        sql`ALTER TABLE seed_credentials ADD COLUMN IF NOT EXISTS marketing_autopilot_credentials TEXT`,
      );
      await db.execute(
        sql`ALTER TABLE seed_credentials ADD COLUMN IF NOT EXISTS marketing_autopilot_last_run TEXT`,
      );
      await db.execute(
        sql`ALTER TABLE platform_runtime_secrets ADD COLUMN IF NOT EXISTS google_gsc_client_id TEXT`,
      );
      await db.execute(
        sql`ALTER TABLE platform_runtime_secrets ADD COLUMN IF NOT EXISTS google_gsc_client_secret TEXT`,
      );
    })().catch((err) => {
      coreReady = null;
      throw err;
    });
  }

  await coreReady;
}
