import { NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { users, projects, usageLogs, seoLandingPages, seedCredentials } from "@/lib/schema";
import {
  marketingCampaigns,
  marketingLeads,
  marketingReferrals,
  marketingUtmLinks,
} from "@/lib/marketing/schema";
import { getPiggyBankSummary } from "@/lib/piggy-bank";
import { sql, desc, eq, count } from "drizzle-orm";

export const dynamic = "force-dynamic";

type StripeChargeRow = {
  id: string;
  amount: number;
  currency: string;
  created: number;
  description: string | null;
  customer: string | null;
};

export async function GET() {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    allUsers,
    [[{ totalUsers }], [{ totalProjects }], [{ totalApiCalls }], [{ totalSeoPages }]],
    [[{ totalCampaigns }], [{ activeCampaigns }], [{ totalLeads }], [{ convertedLeads }]],
    [[{ totalReferrals }], [{ referralClicks }], [{ referralSignups }]],
    [[{ totalUtmLinks }], [{ utmClicks }]],
    credRows,
  ] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
        stripeCustomerId: users.stripeCustomerId,
        stripeSubscriptionId: users.stripeSubscriptionId,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(500),

    Promise.all([
      db.select({ totalUsers: count() }).from(users),
      db.select({ totalProjects: count() }).from(projects),
      db.select({ totalApiCalls: count() }).from(usageLogs),
      db
        .select({ totalSeoPages: count() })
        .from(seoLandingPages)
        .where(eq(seoLandingPages.published, true)),
    ]),

    Promise.all([
      db.select({ totalCampaigns: count() }).from(marketingCampaigns),
      db
        .select({ activeCampaigns: count() })
        .from(marketingCampaigns)
        .where(eq(marketingCampaigns.status, "active")),
      db.select({ totalLeads: count() }).from(marketingLeads),
      db
        .select({ convertedLeads: count() })
        .from(marketingLeads)
        .where(eq(marketingLeads.status, "converted")),
    ]),

    Promise.all([
      db.select({ totalReferrals: count() }).from(marketingReferrals),
      db
        .select({
          referralClicks: sql<number>`coalesce(sum(${marketingReferrals.clicks}), 0)::int`,
        })
        .from(marketingReferrals),
      db
        .select({
          referralSignups: sql<number>`coalesce(sum(${marketingReferrals.signups}), 0)::int`,
        })
        .from(marketingReferrals),
    ]),

    Promise.all([
      db.select({ totalUtmLinks: count() }).from(marketingUtmLinks),
      db
        .select({ utmClicks: sql<number>`coalesce(sum(${marketingUtmLinks.clicks}), 0)::int` })
        .from(marketingUtmLinks),
    ]),

    db
      .select({
        hasGodaddy: sql<boolean>`(${seedCredentials.godaddyApiKey} is not null)`,
        hasGoogleSa: sql<boolean>`(${seedCredentials.googleServiceAccountJson} is not null)`,
        googleSiteUrl: seedCredentials.googleSiteUrl,
        indexnowKey: seedCredentials.indexnowKey,
      })
      .from(seedCredentials)
      .limit(1),
  ]);

  let stripe = {
    lifetimeRevenue: 0,
    mrr: 0,
    arr: 0,
    activeSubscriptions: 0,
    trialingSubscriptions: 0,
    payingCustomers: 0,
    recentCharges: [] as StripeChargeRow[],
    available: false,
  };

  try {
    const [lifetimeRow, subStats, recentCharges, payingRow] = await Promise.all([
      db.execute(sql`
        SELECT coalesce(sum(amount), 0)::bigint as total_cents
        FROM stripe.charges
        WHERE status = 'succeeded'
      `),
      db.execute(sql`
        SELECT status, count(*)::int as count,
          coalesce(sum((items->0->'plan'->>'amount')::int), 0)::int as total_amount
        FROM stripe.subscriptions
        GROUP BY status
      `),
      db.execute(sql`
        SELECT id, amount, currency, created, description, customer
        FROM stripe.charges
        WHERE status = 'succeeded'
        ORDER BY created DESC
        LIMIT 20
      `),
      db.execute(sql`
        SELECT count(distinct customer)::int as count
        FROM stripe.subscriptions
        WHERE status IN ('active', 'trialing')
      `),
    ]);

    let mrr = 0;
    let activeCount = 0;
    let trialingCount = 0;
    for (const row of subStats.rows as { status: string; count: number; total_amount: number }[]) {
      if (row.status === "active") {
        activeCount = row.count;
        mrr += row.total_amount / 100;
      }
      if (row.status === "trialing") trialingCount = row.count;
    }

    const lifetimeCents = Number(
      (lifetimeRow.rows[0] as { total_cents: string })?.total_cents ?? 0,
    );

    stripe = {
      lifetimeRevenue: lifetimeCents / 100,
      mrr,
      arr: mrr * 12,
      activeSubscriptions: activeCount,
      trialingSubscriptions: trialingCount,
      payingCustomers: (payingRow.rows[0] as { count: number })?.count ?? 0,
      recentCharges: (recentCharges.rows as StripeChargeRow[]).map((c) => ({
        ...c,
        amount: (c.amount ?? 0) / 100,
      })),
      available: true,
    };
  } catch (e) {
    console.warn("[admin/overview] Stripe not available:", e);
  }

  let piggyBank = {
    balance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    entryCount: 0,
    available: false,
  };

  try {
    const summary = await getPiggyBankSummary();
    piggyBank = {
      balance: summary.balanceCents / 100,
      totalIncome: summary.totalIncomeCents / 100,
      totalExpenses: summary.totalExpenseCents / 100,
      entryCount: summary.entryCount,
      available: true,
    };
  } catch (e) {
    console.warn("[admin/overview] Piggy bank not available:", e);
  }

  const creds = credRows[0];
  const marketingHealth = {
    campaigns: Number(totalCampaigns ?? 0),
    activeCampaigns: Number(activeCampaigns ?? 0),
    leads: Number(totalLeads ?? 0),
    convertedLeads: Number(convertedLeads ?? 0),
    referrals: Number(totalReferrals ?? 0),
    referralClicks: Number(referralClicks ?? 0),
    referralSignups: Number(referralSignups ?? 0),
    utmLinks: Number(totalUtmLinks ?? 0),
    utmClicks: Number(utmClicks ?? 0),
    seoPages: Number(totalSeoPages ?? 0),
    godaddyConnected: Boolean(creds?.hasGodaddy),
    googleSearchConsole: Boolean(creds?.hasGoogleSa && creds?.googleSiteUrl),
    indexNowConfigured: Boolean(creds?.indexnowKey),
    status:
      Number(totalSeoPages ?? 0) > 0 && (Boolean(creds?.indexnowKey) || Boolean(creds?.hasGoogleSa))
        ? "operational"
        : "needs_setup",
  };

  return NextResponse.json({
    platform: {
      totalUsers: Number(totalUsers ?? 0),
      totalProjects: Number(totalProjects ?? 0),
      totalApiCalls: Number(totalApiCalls ?? 0),
    },
    stripe,
    piggyBank,
    marketing: marketingHealth,
    users: allUsers.map((u) => ({
      ...u,
      hasStripe: Boolean(u.stripeCustomerId),
      isSubscribed: Boolean(u.stripeSubscriptionId),
    })),
  });
}
