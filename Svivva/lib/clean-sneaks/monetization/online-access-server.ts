import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import {
  hasUnlimitedKleanOnline,
  kleanOnlineMonthlyLimit,
} from "@/lib/billing/resolve-user-plan";
import {
  canStartOnlineTable,
  consumptionId,
  monthlyLimitForSubject,
  nextUtcMonthStart,
  utcMonthKey,
  type OnlineSubject,
} from "./online-access";
import { ensureKleanProfileTables } from "./ensure-klean-profile";

export type OnlineAccessSnapshot = {
  unlimited: boolean;
  signedIn: boolean;
  usedThisMonth: number;
  limit: number;
  remaining: number;
  resetsAt: string;
  requiresSignIn: boolean;
  gamerTag: string | null;
};

export function resolveOnlineSubject(
  userId: string | null,
  deviceId: string | null,
): OnlineSubject | null {
  if (userId) return { type: "user", id: userId.slice(0, 64) };
  if (deviceId && deviceId.length >= 8) return { type: "device", id: deviceId.slice(0, 64) };
  return null;
}

export async function countOnlineSessionsThisMonth(subject: OnlineSubject): Promise<number> {
  await ensureKleanProfileTables();
  const monthKey = utcMonthKey();
  try {
    const result = await db.execute(sql`
      SELECT COUNT(*)::int AS c
      FROM klean_online_play_ledger
      WHERE subject_type = ${subject.type}
        AND subject_id = ${subject.id}
        AND month_key = ${monthKey}
    `);
    const row = result.rows[0] as { c?: number } | undefined;
    return Number(row?.c ?? 0);
  } catch {
    return 0;
  }
}

export async function getOnlineAccessSnapshot(opts: {
  userId: string | null;
  deviceId: string | null;
  dbUser?: typeof users.$inferSelect | null;
}): Promise<OnlineAccessSnapshot> {
  await ensureKleanProfileTables();
  const signedIn = Boolean(opts.userId);
  const unlimited = hasUnlimitedKleanOnline(opts.dbUser ?? null);
  const subject = resolveOnlineSubject(opts.userId, opts.deviceId);
  const limit =
    subject != null
      ? monthlyLimitForSubject(subject, unlimited)
      : kleanOnlineMonthlyLimit(signedIn, unlimited);

  let usedThisMonth = 0;
  if (subject && !unlimited) {
    usedThisMonth = await countOnlineSessionsThisMonth(subject);
  }

  const remaining = unlimited || limit === 0 ? -1 : Math.max(0, limit - usedThisMonth);

  return {
    unlimited,
    signedIn,
    usedThisMonth,
    limit,
    remaining,
    resetsAt: nextUtcMonthStart().toISOString(),
    requiresSignIn: !signedIn && !unlimited,
    gamerTag: opts.dbUser?.gamerTag ?? null,
  };
}

export async function assertCanJoinOnlineTable(
  subject: OnlineSubject,
  unlimited: boolean,
): Promise<{ ok: true } | { ok: false; code: "quota_exhausted" | "sign_in_required" }> {
  if (unlimited) return { ok: true };
  if (subject.type === "device") {
    const used = await countOnlineSessionsThisMonth(subject);
    const limit = monthlyLimitForSubject(subject, false);
    const gate = canStartOnlineTable(used, limit);
    if (!gate.ok) return { ok: false, code: "quota_exhausted" };
    return { ok: true };
  }
  const used = await countOnlineSessionsThisMonth(subject);
  const limit = monthlyLimitForSubject(subject, false);
  const gate = canStartOnlineTable(used, limit);
  if (!gate.ok) return { ok: false, code: "quota_exhausted" };
  return { ok: true };
}

/** Idempotent — one row per subject per room when the table actually starts. */
export async function recordOnlineTableStart(
  subject: OnlineSubject,
  roomCode: string,
): Promise<void> {
  await ensureKleanProfileTables();
  const id = consumptionId(subject, roomCode);
  try {
    await db.execute(sql`
      INSERT INTO klean_online_play_ledger (id, subject_type, subject_id, month_key, room_code)
      VALUES (${id}, ${subject.type}, ${subject.id}, ${utcMonthKey()}, ${roomCode})
      ON CONFLICT (subject_type, subject_id, room_code) DO NOTHING
    `);
  } catch {
    /* ignore */
  }
}

export async function loadDbUser(userId: string) {
  const [row] = await db.select().from(users).where(eq(users.id, userId));
  return row ?? null;
}

export async function setGamerTagForUser(userId: string, tag: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  await ensureKleanProfileTables();
  try {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.gamerTag, tag), ne(users.id, userId)));
    if (existing) {
      return { ok: false, reason: "Gamer tag already taken." };
    }
    await db.update(users).set({ gamerTag: tag, updatedAt: new Date() }).where(eq(users.id, userId));
    return { ok: true };
  } catch {
    return { ok: false, reason: "Could not save gamer tag." };
  }
}
