import { db } from "@/lib/db";
import { marketingReferrals, marketingReferralEvents } from "@/lib/marketing/schema";
import { eq, desc } from "drizzle-orm";

function generateCode(email: string): string {
  const base = email.split("@")[0].replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${suffix}`;
}

export async function createReferral(data: {
  referrerId: string;
  referrerEmail: string;
  siteUrl: string;
  rewardType?: string;
  rewardAmount?: number;
}) {
  const code = generateCode(data.referrerEmail);
  const referralLink = `${data.siteUrl}?ref=${code}`;
  const [referral] = await db
    .insert(marketingReferrals)
    .values({
      referrerId: data.referrerId,
      referrerEmail: data.referrerEmail,
      referralCode: code,
      referralLink,
      rewardType: data.rewardType ?? "credit",
      rewardAmount: data.rewardAmount ?? 10,
    })
    .returning();
  return referral;
}

export async function getReferrals() {
  return db.select().from(marketingReferrals).orderBy(desc(marketingReferrals.createdAt));
}

export async function getReferralByCode(code: string) {
  const [referral] = await db
    .select()
    .from(marketingReferrals)
    .where(eq(marketingReferrals.referralCode, code));
  return referral ?? null;
}

export async function trackReferralEvent(referralId: string, eventType: "click" | "signup" | "conversion", extra?: { referredEmail?: string; ip?: string; userAgent?: string }) {
  await db.insert(marketingReferralEvents).values({ referralId, eventType, ...extra });
  const referral = await db.select().from(marketingReferrals).where(eq(marketingReferrals.id, referralId));
  if (referral[0]) {
    const current = referral[0];
    await db
      .update(marketingReferrals)
      .set({
        clicks: eventType === "click" ? (current.clicks ?? 0) + 1 : current.clicks,
        signups: eventType === "signup" ? (current.signups ?? 0) + 1 : current.signups,
        conversions: eventType === "conversion" ? (current.conversions ?? 0) + 1 : current.conversions,
      })
      .where(eq(marketingReferrals.id, referralId));
  }
}

export async function getReferralStats() {
  const all = await db.select().from(marketingReferrals);
  return {
    total: all.length,
    active: all.filter((r) => r.status === "active").length,
    totalClicks: all.reduce((s, r) => s + (r.clicks ?? 0), 0),
    totalSignups: all.reduce((s, r) => s + (r.signups ?? 0), 0),
    totalConversions: all.reduce((s, r) => s + (r.conversions ?? 0), 0),
    conversionRate: all.length
      ? ((all.reduce((s, r) => s + (r.conversions ?? 0), 0) / Math.max(all.reduce((s, r) => s + (r.clicks ?? 0), 0), 1)) * 100).toFixed(1)
      : "0",
  };
}
