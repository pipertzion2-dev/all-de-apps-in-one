/**
 * Burns run history. Follows the same dynamic-column pattern as
 * marketing-autopilot-credentials: the column is added on demand so no
 * migration is needed, and every failure path degrades to "no history" rather
 * than breaking the page.
 */
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { resolveOrbitInternalUserId } from "@/lib/orbit/internal-user";
import { getPrimaryAdminUserId } from "@/lib/auth/admin";
import type { BurnsRunResult } from "@/lib/burns/burns-runner";

const MAX_HISTORY = 14;

let columnEnsured = false;

async function ensureColumn() {
  if (columnEnsured) return;
  try {
    await db.execute(sql`ALTER TABLE seed_credentials ADD COLUMN IF NOT EXISTS burns_runs TEXT`);
    columnEnsured = true;
  } catch {
    /* table may not exist in test env */
  }
}

async function ownerId(): Promise<string> {
  return (await resolveOrbitInternalUserId()) || getPrimaryAdminUserId() || "orbit-admin";
}

function parseRuns(raw: unknown): BurnsRunResult[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BurnsRunResult[]) : [];
  } catch {
    return [];
  }
}

/** Most recent runs, newest first. Empty when the store is unavailable. */
export async function loadBurnsRuns(): Promise<BurnsRunResult[]> {
  try {
    await ensureColumn();
    const userId = await ownerId();
    const result = await db.execute(
      sql`SELECT burns_runs FROM seed_credentials WHERE user_id = ${userId} LIMIT 1`,
    );
    const row = result.rows?.[0] as Record<string, unknown> | undefined;
    return parseRuns(row?.burns_runs);
  } catch {
    return [];
  }
}

export async function loadLastBurnsRun(): Promise<BurnsRunResult | null> {
  const runs = await loadBurnsRuns();
  return runs[0] ?? null;
}

/** Prepend a run and trim history. Never throws — a failed write must not fail the run. */
export async function saveBurnsRun(run: BurnsRunResult): Promise<void> {
  try {
    await ensureColumn();
    const userId = await ownerId();
    const existing = await loadBurnsRuns();
    const json = JSON.stringify([run, ...existing].slice(0, MAX_HISTORY));
    await db.execute(sql`
      INSERT INTO seed_credentials (id, user_id, burns_runs, updated_at)
      VALUES (${crypto.randomUUID()}, ${userId}, ${json}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        burns_runs = ${json},
        updated_at = NOW()
    `);
  } catch {
    /* history is best-effort */
  }
}

/** Audit row in growth_tasks so Burns shows up alongside the other scheduled work. */
export async function recordBurnsAudit(run: BurnsRunResult): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO growth_tasks (id, task_type, product, status, details, run_at)
      VALUES (
        ${crypto.randomUUID()},
        ${"burns_daily_run"},
        ${"zzai"},
        ${run.ok ? "completed" : "failed"},
        ${JSON.stringify({
          trigger: run.trigger,
          summary: run.summary,
          counts: run.counts,
          truncated: run.truncated,
        })}::jsonb,
        NOW()
      )
    `);
  } catch {
    /* audit is best-effort */
  }
}
