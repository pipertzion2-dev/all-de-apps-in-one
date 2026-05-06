import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { users, projects, usageLogs } from "@/lib/schema";
import { sql, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Platform metrics ───────────────────────────────────────────────────────
  const [[totalUsers], [totalProjects], [totalApiCalls]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(users),
    db.select({ count: sql<number>`count(*)::int` }).from(projects),
    db.select({ count: sql<number>`count(*)::int` }).from(usageLogs),
  ]);

  // New signups last 7 days and 30 days
  const [[newUsers7d], [newUsers30d]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(users)
      .where(sql`created_at >= now() - interval '7 days'`),
    db.select({ count: sql<number>`count(*)::int` }).from(users)
      .where(sql`created_at >= now() - interval '30 days'`),
  ]);

  // Recent signups
  const recentUsers = await db
    .select({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(10);

  // Recent projects
  const recentProjects = await db
    .select({ id: projects.id, name: projects.name, status: projects.status, createdAt: projects.createdAt })
    .from(projects)
    .orderBy(desc(projects.createdAt))
    .limit(10);

  // Plan breakdown
  const planBreakdown = await db.execute(sql`
    SELECT plan, count(*)::int as count FROM users GROUP BY plan ORDER BY count DESC
  `);

  // ── Stripe metrics (via Replit Stripe sync schema) ─────────────────────────
  let stripeData = {
    mrr: 0, arr: 0, totalRevenue: 0,
    activeSubscriptions: 0, trialingSubscriptions: 0,
    recentCharges: [] as any[],
    recentSubscriptions: [] as any[],
    topPlans: [] as any[],
  };

  try {
    const [subStats, recentCharges, recentSubs, planStats] = await Promise.all([
      db.execute(sql`
        SELECT
          status,
          count(*)::int as count,
          coalesce(sum(
            CASE
              WHEN si.plan_amount IS NOT NULL THEN si.plan_amount
              ELSE 0
            END
          ), 0)::int as total_amount
        FROM stripe.subscriptions s
        LEFT JOIN LATERAL (
          SELECT (items->0->'plan'->>'amount')::int as plan_amount
          FROM stripe.subscriptions WHERE id = s.id
        ) si ON true
        GROUP BY status
      `).catch(() => ({ rows: [] })),

      db.execute(sql`
        SELECT id, amount, currency, status, description, created,
               customer, metadata
        FROM stripe.charges
        WHERE status = 'succeeded'
        ORDER BY created DESC
        LIMIT 15
      `).catch(() => ({ rows: [] })),

      db.execute(sql`
        SELECT s.id, s.status, s.current_period_end, s.created,
               s.customer, s.cancel_at_period_end,
               (s.items->0->'plan'->>'amount')::int as amount,
               (s.items->0->'plan'->>'interval') as interval,
               p.name as product_name
        FROM stripe.subscriptions s
        LEFT JOIN stripe.products p ON s.items->0->'plan'->>'product' = p.id
        ORDER BY s.created DESC
        LIMIT 15
      `).catch(() => ({ rows: [] })),

      db.execute(sql`
        SELECT p.name, count(s.id)::int as count,
               coalesce(sum((s.items->0->'plan'->>'amount')::int), 0)::int as monthly_revenue
        FROM stripe.subscriptions s
        LEFT JOIN stripe.products p ON s.items->0->'plan'->>'product' = p.id
        WHERE s.status = 'active'
        GROUP BY p.name ORDER BY monthly_revenue DESC
      `).catch(() => ({ rows: [] })),
    ]);

    // Compute MRR from active subscriptions
    let mrr = 0;
    let activeCount = 0;
    let trialingCount = 0;
    for (const row of subStats.rows as any[]) {
      if (row.status === "active") {
        activeCount = row.count;
        mrr += row.total_amount / 100;
      }
      if (row.status === "trialing") trialingCount = row.count;
    }

    const totalRevenue = (recentCharges.rows as any[]).reduce(
      (sum: number, c: any) => sum + (c.amount || 0) / 100, 0
    );

    stripeData = {
      mrr,
      arr: mrr * 12,
      totalRevenue,
      activeSubscriptions: activeCount,
      trialingSubscriptions: trialingCount,
      recentCharges: recentCharges.rows,
      recentSubscriptions: recentSubs.rows,
      topPlans: planStats.rows,
    };
  } catch (e) {
    console.warn("[admin/stats] Stripe schema not available:", e);
  }

  return NextResponse.json({
    platform: {
      totalUsers: totalUsers.count,
      totalProjects: totalProjects.count,
      totalApiCalls: totalApiCalls.count,
      newUsers7d: newUsers7d.count,
      newUsers30d: newUsers30d.count,
      planBreakdown: planBreakdown.rows,
      recentUsers,
      recentProjects,
    },
    stripe: stripeData,
  });
}
