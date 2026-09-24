import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { kleanYearSubPrizes } from "@/lib/schema";
import { ensureBillingColumns } from "@/lib/billing/ensure-billing-columns";
import {
  YEAR_SUB_CLAIM_WINDOW_DAYS,
  addDays,
  yearSubWinOdds,
} from "@/lib/clean-sneaks/prizes/year-subscription";

export const dynamic = "force-dynamic";

/**
 * Roll for a free 1-year ZZAI Pro prize after a solo Steal Bundle win.
 * Client must only call this when humanWonSolo is true; server re-checks the flag.
 */
export async function POST(req: NextRequest) {
  try {
    await ensureBillingColumns();
    const body = await req.json().catch(() => ({}));
    const entryId = String(body.entryId || "")
      .trim()
      .slice(0, 120);
    const deviceId = String(body.deviceId || "")
      .trim()
      .slice(0, 64);
    const humanWonSolo = body.humanWonSolo === true;

    if (!entryId || !deviceId) {
      return NextResponse.json({ error: "entryId and deviceId required" }, { status: 400 });
    }
    if (!humanWonSolo) {
      return NextResponse.json({
        won: false,
        reason: "solo_win_required",
        odds: yearSubWinOdds(),
      });
    }

    const [existing] = await db
      .select()
      .from(kleanYearSubPrizes)
      .where(eq(kleanYearSubPrizes.entryId, entryId))
      .limit(1);
    if (existing) {
      return NextResponse.json({
        won: existing.status !== "expired",
        duplicate: true,
        status: existing.status,
        prizeId: existing.status === "pending" ? existing.id : undefined,
        claimToken: existing.status === "pending" ? existing.claimToken : undefined,
        expiresAt: existing.expiresAt?.toISOString?.() ?? existing.expiresAt,
        odds: yearSubWinOdds(),
      });
    }

    // One pending prize per device at a time.
    const [pending] = await db
      .select()
      .from(kleanYearSubPrizes)
      .where(
        and(
          eq(kleanYearSubPrizes.deviceId, deviceId),
          eq(kleanYearSubPrizes.status, "pending"),
          gt(kleanYearSubPrizes.expiresAt, new Date()),
        ),
      )
      .limit(1);
    if (pending) {
      return NextResponse.json({
        won: true,
        alreadyPending: true,
        prizeId: pending.id,
        claimToken: pending.claimToken,
        expiresAt: pending.expiresAt.toISOString(),
        odds: yearSubWinOdds(),
      });
    }

    const odds = yearSubWinOdds();
    const won = Math.random() < odds;
    if (!won) {
      // Record a lost roll so the same entry cannot be re-rolled.
      const lostId = randomBytes(16).toString("hex");
      await db.insert(kleanYearSubPrizes).values({
        id: lostId,
        entryId,
        deviceId,
        status: "expired",
        claimToken: randomBytes(24).toString("hex"),
        expiresAt: new Date(),
      });
      return NextResponse.json({ won: false, odds });
    }

    const prizeId = randomBytes(16).toString("hex");
    const claimToken = randomBytes(24).toString("hex");
    const expiresAt = addDays(new Date(), YEAR_SUB_CLAIM_WINDOW_DAYS);
    await db.insert(kleanYearSubPrizes).values({
      id: prizeId,
      entryId,
      deviceId,
      status: "pending",
      claimToken,
      expiresAt,
    });

    return NextResponse.json({
      won: true,
      prizeId,
      claimToken,
      expiresAt: expiresAt.toISOString(),
      odds,
      message: "You won 1 year of ZZAI Pro — sign in to claim.",
    });
  } catch (err) {
    console.error("year-sub roll:", err);
    return NextResponse.json({ error: "Roll failed" }, { status: 500 });
  }
}
