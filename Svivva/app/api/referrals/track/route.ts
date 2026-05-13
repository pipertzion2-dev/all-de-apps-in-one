import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { referrals, referralRewards, users, referralCampaigns } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { randomBytes } from "crypto";

export const maxDuration = 60;

// Generate unique referral code
function generateReferralCode(userId: string): string {
  const hash = randomBytes(8).toString("hex");
  return `${userId.substring(0, 4)}${hash}`.toLowerCase();
}

// Calculate commission based on level
function calculateCommission(amount: number, level: number, campaign: any): number {
  const rates = {
    1: campaign.commissionRate,
    2: campaign.level2Rate,
    3: campaign.level3Rate,
  };
  const rate = rates[level as keyof typeof rates] || campaign.commissionRate;
  return Math.floor((amount * rate) / 100);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { referredId, source, sourceId, amount } = body;

    if (!referredId || !source) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get active campaign
    const [campaign] = await db
      .select()
      .from(referralCampaigns)
      .where(eq(referralCampaigns.active, true))
      .orderBy(desc(referralCampaigns.createdAt))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ error: "No active referral campaign" }, { status: 400 });
    }

    // Check if this referral already exists
    const [existing] = await db
      .select()
      .from(referrals)
      .where(and(eq(referrals.referrerId, user.id), eq(referrals.referredId, referredId)))
      .limit(1);

    if (existing) {
      // Create reward for existing referral
      const rewardAmount = amount || campaign.bonusPerSignup;
      const commission = calculateCommission(rewardAmount, existing.level, campaign);

      const [reward] = await db
        .insert(referralRewards)
        .values({
          id: crypto.randomUUID(),
          referralId: existing.id,
          referrerId: user.id,
          amount: commission,
          source,
          sourceId,
          level: existing.level,
          status: "pending",
        })
        .returning();

      // Update total earnings
      await db
        .update(referrals)
        .set({
          totalEarnings: existing.totalEarnings + commission,
          updatedAt: new Date(),
        })
        .where(eq(referrals.id, existing.id));

      return NextResponse.json({
        success: true,
        referral: existing,
        reward,
        message: "Reward created for existing referral",
      });
    }

    // Create new referral at level 1
    const [referral] = await db
      .insert(referrals)
      .values({
        id: crypto.randomUUID(),
        referrerId: user.id,
        referredId,
        level: 1,
        commissionRate: campaign.commissionRate,
        status: "active",
      })
      .returning();

    // Create reward for new referral
    const rewardAmount = amount || campaign.bonusPerSignup;
    const commission = calculateCommission(rewardAmount, 1, campaign);

    const [reward] = await db
      .insert(referralRewards)
      .values({
        id: crypto.randomUUID(),
        referralId: referral.id,
        referrerId: user.id,
        amount: commission,
        source,
        sourceId,
        level: 1,
        status: "pending",
      })
      .returning();

    // Update referrer's referral code if they don't have one
    const [referrer] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);

    if (referrer && !referrer.avatarUrl?.includes("ref=")) {
      const referralCode = generateReferralCode(user.id);
      await db
        .update(users)
        .set({ avatarUrl: `${referrer.avatarUrl}?ref=${referralCode}` })
        .where(eq(users.id, user.id));
    }

    return NextResponse.json({
      success: true,
      referral,
      reward,
      message: "New referral created with reward",
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get all referrals for this user
    const userReferrals = await db
      .select({
        id: referrals.id,
        referredId: referrals.referredId,
        level: referrals.level,
        commissionRate: referrals.commissionRate,
        totalEarnings: referrals.totalEarnings,
        status: referrals.status,
        createdAt: referrals.createdAt,
        referredName: users.name,
        referredEmail: users.email,
      })
      .from(referrals)
      .leftJoin(users, eq(referrals.referredId, users.id))
      .where(eq(referrals.referrerId, user.id))
      .orderBy(desc(referrals.createdAt));

    // Get total earnings
    const totalEarnings = userReferrals.reduce((sum, r) => sum + r.totalEarnings, 0);

    // Get pending rewards
    const pendingRewards = await db
      .select()
      .from(referralRewards)
      .where(and(eq(referralRewards.referrerId, user.id), eq(referralRewards.status, "pending")));

    const pendingAmount = pendingRewards.reduce((sum, r) => sum + r.amount, 0);

    return NextResponse.json({
      referrals: userReferrals,
      totalEarnings,
      pendingAmount,
      pendingCount: pendingRewards.length,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
