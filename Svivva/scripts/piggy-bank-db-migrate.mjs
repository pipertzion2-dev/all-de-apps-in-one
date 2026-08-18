/**
 * Ensures platform_ledger_entries (admin piggy bank) exists.
 * Safe to run repeatedly — uses CREATE TABLE IF NOT EXISTS.
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

async function run() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.warn("⚠ DATABASE_URL not set — skipping piggy bank migration");
    return;
  }

  const sqlPath = resolve(__dirname, "../migrations/004_piggy_bank.sql");
  const sql = readFileSync(sqlPath, "utf8");
  const pool = new Pool({ connectionString: url });

  try {
    await pool.query(sql);
    console.log("✓ Admin piggy bank table ready");
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error("Piggy bank DB migration failed:", err);
  process.exit(1);
});
