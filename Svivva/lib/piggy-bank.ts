import { db } from "@/lib/db";
import { platformLedgerEntries } from "@/lib/schema";
import { desc, eq, sql } from "drizzle-orm";

export type LedgerEntryType = "income" | "expense" | "adjustment";
export type LedgerEntrySource = "manual" | "stripe" | "referral" | "marketplace";

export type PiggyBankSummary = {
  balanceCents: number;
  totalIncomeCents: number;
  totalExpenseCents: number;
  entryCount: number;
};

export type LedgerEntry = {
  id: string;
  amountCents: number;
  currency: string;
  type: string;
  category: string | null;
  description: string | null;
  source: string;
  externalId: string | null;
  createdAt: string;
};

/** Runtime migration — Vercel build often has no DATABASE_URL; create table on first use. */
let tableReady: Promise<void> | null = null;

export async function ensurePiggyBankTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS platform_ledger_entries (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          amount_cents INTEGER NOT NULL,
          currency TEXT NOT NULL DEFAULT 'usd',
          type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'adjustment')),
          category TEXT,
          description TEXT,
          source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'stripe', 'referral', 'marketplace')),
          external_id TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_platform_ledger_created_at
        ON platform_ledger_entries(created_at DESC)
      `);
      await db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_ledger_external_id
        ON platform_ledger_entries(external_id) WHERE external_id IS NOT NULL
      `);
    })().catch((err) => {
      tableReady = null;
      throw err;
    });
  }
  await tableReady;
}

export async function getPiggyBankSummary(): Promise<PiggyBankSummary> {
  await ensurePiggyBankTable();
  const [row] = await db
    .select({
      balanceCents: sql<number>`coalesce(sum(${platformLedgerEntries.amountCents}), 0)::int`,
      totalIncomeCents: sql<number>`coalesce(sum(case when ${platformLedgerEntries.amountCents} > 0 then ${platformLedgerEntries.amountCents} else 0 end), 0)::int`,
      totalExpenseCents: sql<number>`coalesce(sum(case when ${platformLedgerEntries.amountCents} < 0 then abs(${platformLedgerEntries.amountCents}) else 0 end), 0)::int`,
      entryCount: sql<number>`count(*)::int`,
    })
    .from(platformLedgerEntries);

  return {
    balanceCents: row?.balanceCents ?? 0,
    totalIncomeCents: row?.totalIncomeCents ?? 0,
    totalExpenseCents: row?.totalExpenseCents ?? 0,
    entryCount: row?.entryCount ?? 0,
  };
}

export async function listLedgerEntries(limit = 50): Promise<LedgerEntry[]> {
  await ensurePiggyBankTable();
  const rows = await db
    .select()
    .from(platformLedgerEntries)
    .orderBy(desc(platformLedgerEntries.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    amountCents: r.amountCents,
    currency: r.currency,
    type: r.type,
    category: r.category,
    description: r.description,
    source: r.source,
    externalId: r.externalId,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function addLedgerEntry(input: {
  amountCents: number;
  type: LedgerEntryType;
  currency?: string;
  category?: string;
  description?: string;
  source?: LedgerEntrySource;
  externalId?: string;
}): Promise<LedgerEntry> {
  await ensurePiggyBankTable();
  const [row] = await db
    .insert(platformLedgerEntries)
    .values({
      amountCents: input.amountCents,
      currency: input.currency ?? "usd",
      type: input.type,
      category: input.category ?? null,
      description: input.description ?? null,
      source: input.source ?? "manual",
      externalId: input.externalId ?? null,
    })
    .returning();

  return {
    id: row.id,
    amountCents: row.amountCents,
    currency: row.currency,
    type: row.type,
    category: row.category,
    description: row.description,
    source: row.source,
    externalId: row.externalId,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Record a Stripe charge in the piggy bank (idempotent via external_id). */
export async function recordStripeCharge(input: {
  chargeId: string;
  amountCents: number;
  currency: string;
  description?: string | null;
}): Promise<LedgerEntry | null> {
  const existing = await db
    .select({ id: platformLedgerEntries.id })
    .from(platformLedgerEntries)
    .where(eq(platformLedgerEntries.externalId, input.chargeId))
    .limit(1);

  if (existing.length > 0) return null;

  return addLedgerEntry({
    amountCents: input.amountCents,
    type: "income",
    currency: input.currency,
    category: "subscription",
    description: input.description ?? "Stripe payment",
    source: "stripe",
    externalId: input.chargeId,
  });
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}
