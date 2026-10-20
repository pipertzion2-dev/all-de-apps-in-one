/**
 * Burns run history. Follows the same dynamic-column pattern as
 * marketing-autopilot-credentials: the column is added on demand so no
 * migration is needed, and every failure path degrades to "no history" rather
 * than breaking the page.
 */
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { resolveOrbitOwnerUserId } from "@/lib/orbit/internal-user";
import type { BurnsRunResult } from "@/lib/burns/burns-runner";

const MAX_HISTORY = 14;

let columnEnsured = false;

/** Same-instance fallback when Postgres write/read fails (serverless). */
let memoryLastRun: BurnsRunResult | null = null;
let memoryHistory: BurnsRunResult[] = [];
let memoryProgress: BurnsRunProgress = { status: "idle" };

export type BurnsRunProgress =
  | { status: "idle" }
  | { status: "running"; startedAt: string }
  | { status: "complete"; run: BurnsRunResult }
  | { status: "failed"; error: string; startedAt: string };

async function ensureColumn() {
  if (columnEnsured) return;
  try {
    await db.execute(sql`ALTER TABLE seed_credentials ADD COLUMN IF NOT EXISTS burns_runs TEXT`);
    await db.execute(
      sql`ALTER TABLE seed_credentials ADD COLUMN IF NOT EXISTS burns_progress TEXT`,
    );
    columnEnsured = true;
  } catch {
    /* table may not exist in test env */
  }
}

async function ownerId(): Promise<string> {
  return resolveOrbitOwnerUserId();
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

function parseProgress(raw: unknown): BurnsRunProgress {
  if (!raw || typeof raw !== "string") return { status: "idle" };
  try {
    const parsed = JSON.parse(raw) as BurnsRunProgress;
    if (parsed?.status === "running" && typeof parsed.startedAt === "string") return parsed;
    if (parsed?.status === "complete" && parsed.run?.startedAt) return parsed;
    if (parsed?.status === "failed" && typeof parsed.error === "string") return parsed;
    return { status: "idle" };
  } catch {
    return { status: "idle" };
  }
}

function rememberRun(run: BurnsRunResult) {
  memoryLastRun = run;
  memoryHistory = [run, ...memoryHistory.filter((h) => h.startedAt !== run.startedAt)].slice(
    0,
    MAX_HISTORY,
  );
  memoryProgress = { status: "complete", run };
}

/** Live run state for the dashboard poll loop (manual async runs). */
export async function loadBurnsProgress(): Promise<BurnsRunProgress> {
  try {
    await ensureColumn();
    const userId = await ownerId();
    const result = await db.execute(
      sql`SELECT burns_progress FROM seed_credentials WHERE user_id = ${userId} LIMIT 1`,
    );
    const row = result.rows?.[0] as Record<string, unknown> | undefined;
    const parsed = parseProgress(row?.burns_progress);
    if (parsed.status !== "idle") {
      memoryProgress = parsed;
      return parsed;
    }
  } catch {
    /* fall through to memory */
  }
  return memoryProgress;
}

export async function setBurnsProgress(progress: BurnsRunProgress): Promise<void> {
  if (progress.status === "complete") rememberRun(progress.run);
  else memoryProgress = progress;

  try {
    await ensureColumn();
    const userId = await ownerId();
    const json = progress.status === "idle" ? null : JSON.stringify(progress);
    await db.execute(sql`
      INSERT INTO seed_credentials (id, user_id, burns_progress, updated_at)
      VALUES (${crypto.randomUUID()}, ${userId}, ${json}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        burns_progress = ${json},
        updated_at = NOW()
    `);
  } catch {
    /* progress is best-effort */
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
    const parsed = parseRuns(row?.burns_runs);
    if (parsed.length) {
      memoryLastRun = parsed[0] ?? null;
      memoryHistory = parsed;
      return parsed;
    }
  } catch {
    /* fall through to memory */
  }
  return memoryHistory.length ? memoryHistory : memoryLastRun ? [memoryLastRun] : [];
}

export async function loadLastBurnsRun(): Promise<BurnsRunResult | null> {
  const runs = await loadBurnsRuns();
  return runs[0] ?? memoryLastRun;
}

/** Prepend a run and trim history. Never throws — a failed write must not fail the run. */
export async function saveBurnsRun(run: BurnsRunResult): Promise<void> {
  rememberRun(run);
  try {
    await ensureColumn();
    const userId = await ownerId();
    const json = JSON.stringify(memoryHistory.slice(0, MAX_HISTORY));
    await db.execute(sql`
      INSERT INTO seed_credentials (id, user_id, burns_runs, updated_at)
      VALUES (${crypto.randomUUID()}, ${userId}, ${json}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        burns_runs = ${json},
        updated_at = NOW()
    `);
  } catch {
    /* history is best-effort — memoryLastRun still holds the result */
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

/** Resolve the best run snapshot for API responses (DB → progress → memory). */
export async function resolveBurnsLastRun(): Promise<BurnsRunResult | null> {
  const progress = await loadBurnsProgress();
  if (progress.status === "complete") return progress.run;
  const runs = await loadBurnsRuns();
  return runs[0] ?? memoryLastRun;
}
