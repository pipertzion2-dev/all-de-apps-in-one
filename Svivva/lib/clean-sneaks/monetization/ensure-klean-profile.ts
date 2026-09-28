import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { ensureBillingColumns } from "@/lib/billing/ensure-billing-columns";

let ensured = false;

export async function ensureKleanProfileTables(): Promise<void> {
  if (ensured) return;
  try {
    await ensureBillingColumns();
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS gamer_tag TEXT`);
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS users_gamer_tag_unique
      ON users (gamer_tag)
      WHERE gamer_tag IS NOT NULL
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS klean_online_play_ledger (
        id TEXT PRIMARY KEY,
        subject_type TEXT NOT NULL,
        subject_id TEXT NOT NULL,
        month_key TEXT NOT NULL,
        room_code TEXT NOT NULL,
        consumed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (subject_type, subject_id, room_code)
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS klean_online_play_ledger_month
      ON klean_online_play_ledger (subject_type, subject_id, month_key)
    `);
    ensured = true;
  } catch {
    /* test / no DB */
  }
}
