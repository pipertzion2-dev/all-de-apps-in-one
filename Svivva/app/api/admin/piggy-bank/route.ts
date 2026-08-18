import { NextResponse } from "next/server";
import { z } from "zod";
import { hasAdminAccess } from "@/lib/auth/admin";
import {
  addLedgerEntry,
  getPiggyBankSummary,
  listLedgerEntries,
  type LedgerEntryType,
} from "@/lib/piggy-bank";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
  type: z.enum(["income", "expense", "adjustment"]),
  description: z.string().max(500).optional(),
  category: z.string().max(100).optional(),
  currency: z.string().length(3).optional(),
});

export async function GET() {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [summary, entries] = await Promise.all([getPiggyBankSummary(), listLedgerEntries(100)]);

    return NextResponse.json({
      summary: {
        balance: summary.balanceCents / 100,
        totalIncome: summary.totalIncomeCents / 100,
        totalExpenses: summary.totalExpenseCents / 100,
        entryCount: summary.entryCount,
      },
      entries: entries.map((e) => ({
        id: e.id,
        amount: e.amountCents / 100,
        currency: e.currency,
        type: e.type,
        category: e.category,
        description: e.description,
        source: e.source,
        createdAt: e.createdAt,
      })),
    });
  } catch (e) {
    console.error("[admin/piggy-bank] GET failed:", e);
    return NextResponse.json({ error: "Failed to load piggy bank" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { amount, type, description, category, currency } = parsed.data;
  const amountCents = Math.round(amount * 100);
  const signedCents =
    type === "expense" ? -amountCents : type === "adjustment" ? amountCents : amountCents;

  try {
    const entry = await addLedgerEntry({
      amountCents: signedCents,
      type: type as LedgerEntryType,
      description,
      category: category ?? (type === "income" ? "manual" : type === "expense" ? "expense" : "adjustment"),
      currency: currency?.toLowerCase() ?? "usd",
      source: "manual",
    });

    const summary = await getPiggyBankSummary();

    return NextResponse.json({
      entry: {
        id: entry.id,
        amount: entry.amountCents / 100,
        currency: entry.currency,
        type: entry.type,
        category: entry.category,
        description: entry.description,
        source: entry.source,
        createdAt: entry.createdAt,
      },
      summary: {
        balance: summary.balanceCents / 100,
        totalIncome: summary.totalIncomeCents / 100,
        totalExpenses: summary.totalExpenseCents / 100,
        entryCount: summary.entryCount,
      },
    });
  } catch (e) {
    console.error("[admin/piggy-bank] POST failed:", e);
    return NextResponse.json({ error: "Failed to add entry" }, { status: 500 });
  }
}
