import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects, usageLogs } from "@/lib/schema";
import { eq, and, gte, sql, count, avg, sum, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get("days") || "30");

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const userProjects = await db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(eq(projects.ownerId, user.id));

    const projectIds = userProjects.map((p) => p.id);

    if (projectIds.length === 0) {
      return NextResponse.json({
        stats: {
          apiCallsToday: 0,
          avgResponseTime: null,
          successRate: null,
          tokensUsed: 0,
        },
        recentRequests: [],
      });
    }

    const [todayStats] = await db
      .select({
        count: count(),
        avgLatency: avg(usageLogs.latencyMs),
        totalTokens: sum(usageLogs.tokensUsed),
      })
      .from(usageLogs)
      .where(
        and(sql`${usageLogs.projectId} = ANY(${projectIds})`, gte(usageLogs.createdAt, yesterday)),
      );

    const [successStats] = await db
      .select({ count: count() })
      .from(usageLogs)
      .where(
        and(
          sql`${usageLogs.projectId} = ANY(${projectIds})`,
          gte(usageLogs.createdAt, yesterday),
          eq(usageLogs.status, "success"),
        ),
      );

    const totalCalls = todayStats?.count || 0;
    const successCalls = successStats?.count || 0;
    const successRate = totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : null;

    const recentRequests = await db
      .select({
        id: usageLogs.id,
        projectId: usageLogs.projectId,
        input: usageLogs.input,
        status: usageLogs.status,
        latencyMs: usageLogs.latencyMs,
        tokensUsed: usageLogs.tokensUsed,
        createdAt: usageLogs.createdAt,
      })
      .from(usageLogs)
      .where(sql`${usageLogs.projectId} = ANY(${projectIds})`)
      .orderBy(desc(usageLogs.createdAt))
      .limit(20);

    const projectMap = Object.fromEntries(userProjects.map((p) => [p.id, p.name]));

    const enrichedRequests = recentRequests.map((r) => ({
      ...r,
      projectName: projectMap[r.projectId] || "Unknown",
    }));

    return NextResponse.json({
      stats: {
        apiCallsToday: todayStats?.count || 0,
        avgResponseTime: todayStats?.avgLatency ? Math.round(Number(todayStats.avgLatency)) : null,
        successRate,
        tokensUsed: todayStats?.totalTokens ? Number(todayStats.totalTokens) : 0,
      },
      recentRequests: enrichedRequests,
    });
  } catch (error: any) {
    console.error("Usage error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
