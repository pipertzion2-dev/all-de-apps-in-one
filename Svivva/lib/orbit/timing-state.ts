import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { resolveOrbitInternalUserId } from "@/lib/orbit/internal-user";
import { TIMING_PLAN_VERSION } from "@/lib/orbit/timing-plan";

export type TimingStepLog = {
  stepId: string;
  at: string;
  ok: boolean;
  summary: string;
};

export type TimingState = {
  version: number;
  completedStepIds: string[];
  lastCompletedAt: string | null;
  logs: TimingStepLog[];
};

const EMPTY: TimingState = {
  version: TIMING_PLAN_VERSION,
  completedStepIds: [],
  lastCompletedAt: null,
  logs: [],
};

let columnEnsured = false;

async function ensureColumn(): Promise<void> {
  if (columnEnsured) return;
  try {
    await db.execute(
      sql`ALTER TABLE seed_credentials ADD COLUMN IF NOT EXISTS orbit_timing_state TEXT`,
    );
    columnEnsured = true;
  } catch {
    columnEnsured = true;
  }
}

export async function loadTimingState(): Promise<TimingState> {
  await ensureColumn();
  const userId = await resolveOrbitInternalUserId();
  if (!userId) return { ...EMPTY };
  try {
    const result = await db.execute(
      sql`SELECT orbit_timing_state FROM seed_credentials WHERE user_id = ${userId} LIMIT 1`,
    );
    const raw = (result.rows?.[0] as { orbit_timing_state?: string } | undefined)?.orbit_timing_state;
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as TimingState;
    return {
      version: parsed.version ?? TIMING_PLAN_VERSION,
      completedStepIds: parsed.completedStepIds ?? [],
      lastCompletedAt: parsed.lastCompletedAt ?? null,
      logs: parsed.logs ?? [],
    };
  } catch {
    return { ...EMPTY };
  }
}

export async function saveTimingState(state: TimingState): Promise<void> {
  await ensureColumn();
  const userId = (await resolveOrbitInternalUserId()) || "orbit-admin";
  const payload = JSON.stringify(state);
  await db.execute(sql`
    INSERT INTO seed_credentials (id, user_id, orbit_timing_state, updated_at)
    VALUES (${crypto.randomUUID()}, ${userId}, ${payload}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET orbit_timing_state = ${payload}, updated_at = NOW()
  `);
}
