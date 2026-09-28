import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import {
  membershipAccessCookieName,
  membershipAccessCookieOptions,
  membershipAccessCookieValue,
  verifyMembershipAccessCode,
} from "@/lib/auth/membership-access";
import { checkRateLimit, clientIp } from "@/lib/auth/rate-limit";
import {
  CASHAPP_SUBSCRIPTION_SOURCE,
  computeCashAppSubscriptionUntil,
} from "@/lib/billing/cashapp-recurring";
import { ensureBillingColumns } from "@/lib/billing/ensure-billing-columns";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";

/** Subscriber unlock — urrthang only. Never sets Orbit admin cookie. */
export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limit = checkRateLimit(`membership-code:${ip}`, 8, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Try again shortly." },
        {
          status: 429,
          headers: limit.retryAfterSec ? { "Retry-After": String(limit.retryAfterSec) } : undefined,
        },
      );
    }

    const { code } = (await request.json()) as { code?: string };
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (!verifyMembershipAccessCode(code)) {
      return NextResponse.json({ error: "Incorrect code" }, { status: 401 });
    }

    const user = await getCurrentUser();
    let proAccessUntil: string | null = null;
    if (user) {
      await ensureBillingColumns();
      const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
      const until = computeCashAppSubscriptionUntil(dbUser?.proAccessUntil ?? null);
      await db
        .update(users)
        .set({
          proAccessUntil: until,
          proAccessSource: CASHAPP_SUBSCRIPTION_SOURCE,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
      proAccessUntil = until.toISOString();
    }

    const response = NextResponse.json({
      success: true,
      membership: true,
      proAccessUntil,
    });

    response.cookies.set(
      membershipAccessCookieName(),
      membershipAccessCookieValue(),
      membershipAccessCookieOptions(),
    );

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
