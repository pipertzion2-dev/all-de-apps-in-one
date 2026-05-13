import { NextRequest, NextResponse } from "next/server";
import { getReferralByCode, trackReferralEvent } from "@/lib/marketing/referrals";

export async function POST(request: NextRequest, { params }: { params: { code: string } }) {
  try {
    const { code } = params;
    const body = await request.json();
    const { eventType, referredEmail } = body;
    const referral = await getReferralByCode(code);
    if (!referral) return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    const ip = request.headers.get("x-forwarded-for") ?? undefined;
    const userAgent = request.headers.get("user-agent") ?? undefined;
    await trackReferralEvent(referral.id, eventType, { referredEmail, ip, userAgent });
    return NextResponse.json({ success: true, referralLink: referral.referralLink });
  } catch (error) {
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  try {
    const referral = await getReferralByCode(params.code);
    if (!referral) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await trackReferralEvent(referral.id, "click", {
      ip: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    return NextResponse.redirect(referral.referralLink.split("?")[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
