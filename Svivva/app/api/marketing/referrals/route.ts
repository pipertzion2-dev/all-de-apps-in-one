import { NextRequest, NextResponse } from "next/server";
import { createReferral, getReferrals, getReferralStats } from "@/lib/marketing/referrals";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("stats") === "true") {
      return NextResponse.json(await getReferralStats());
    }
    return NextResponse.json(await getReferrals());
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referrerId, referrerEmail, rewardType, rewardAmount } = body;
    if (!referrerId || !referrerEmail) {
      return NextResponse.json({ error: "referrerId and referrerEmail are required" }, { status: 400 });
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://svivva.com";
    const referral = await createReferral({ referrerId, referrerEmail, siteUrl, rewardType, rewardAmount });
    return NextResponse.json(referral, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
  }
}
