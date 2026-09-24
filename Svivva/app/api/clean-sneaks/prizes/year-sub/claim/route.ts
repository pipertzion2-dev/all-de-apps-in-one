import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { kleanYearSubPrizes, users } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureBillingColumns } from "@/lib/billing/ensure-billing-columns";
import {
  YEAR_SUB_SOURCE,
  computeProAccessUntil,
} from "@/lib/clean-sneaks/prizes/year-subscription";

export const dynamic = "force-dynamic";

/**
 * Claim a pending free-year Pro prize onto the signed-in account.
 */
export async function POST(req: NextRequest) {
  try {
    await ensureBillingColumns();
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: "Sign in required to claim your free year of ZZAI Pro", code: "auth_required" },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const prizeId = String(body.prizeId || "")
      .trim()
      .slice(0, 64);
    const claimToken = String(body.claimToken || "")
      .trim()
      .slice(0, 128);
    if (!prizeId || !claimToken) {
      return NextResponse.json({ error: "prizeId and claimToken required" }, { status: 400 });
    }

    const [prize] = await db
      .select()
      .from(kleanYearSubPrizes)
      .where(and(eq(kleanYearSubPrizes.id, prizeId), eq(kleanYearSubPrizes.claimToken, claimToken)))
      .limit(1);

    if (!prize) {
      return NextResponse.json({ error: "Prize not found" }, { status: 404 });
    }
    if (prize.status === "claimed") {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        message: "Already claimed",
      });
    }
    if (prize.status !== "pending" || prize.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "Prize expired" }, { status: 410 });
    }

    const [dbUser] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    const until = computeProAccessUntil(dbUser?.proAccessUntil ?? null);

    await db
      .update(users)
      .set({
        proAccessUntil: until,
        proAccessSource: YEAR_SUB_SOURCE,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await db
      .update(kleanYearSubPrizes)
      .set({
        status: "claimed",
        userId: user.id,
        claimedAt: new Date(),
      })
      .where(eq(kleanYearSubPrizes.id, prizeId));

    return NextResponse.json({
      ok: true,
      plan: "pro",
      proAccessUntil: until.toISOString(),
      source: YEAR_SUB_SOURCE,
      message: "1 year of ZZAI Pro is active on your account.",
    });
  } catch (err) {
    console.error("year-sub claim:", err);
    return NextResponse.json({ error: "Claim failed" }, { status: 500 });
  }
}
