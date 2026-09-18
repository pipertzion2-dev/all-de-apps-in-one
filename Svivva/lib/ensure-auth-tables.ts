/** Creates users + sessions tables when drizzle push did not run on deploy. */

import { executeDatabaseDdl } from "@/lib/db-ddl";

let authTablesEnsured = false;

const USERS_DDL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    avatar_url TEXT,
    password_hash TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    lemon_squeezy_customer_id TEXT,
    lemon_squeezy_subscription_id TEXT,
    payment_provider TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

const SESSIONS_DDL = `
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

export async function ensureAuthTables(): Promise<void> {
  if (authTablesEnsured) return;
  await executeDatabaseDdl(USERS_DDL);
  await executeDatabaseDdl(SESSIONS_DDL);
  authTablesEnsured = true;
}

export function isMissingAuthTableError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    /relation .*users.* does not exist/i.test(msg) ||
    /relation .*sessions.* does not exist/i.test(msg)
  );
}
