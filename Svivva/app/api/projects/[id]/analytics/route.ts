import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { projectRepository } from "@/lib/repositories";
import { db } from "@/lib/db";
import { usageLogs, analyticsRollups } from "@/lib/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const project = await projectRepository.findById(id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "7d";
    const interval = searchParams.get("interval") || "day";

    const now = new Date();
    let startDate: Date;

    switch (range) {
      case "1d":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const rollups = await db
      .select()
      .from(analyticsRollups)
      .where(
        and(
          eq(analyticsRollups.projectId, id),
          eq(analyticsRollups.interval, interval),
          gte(analyticsRollups.periodStart, startDate)
        )
      )
      .orderBy(analyticsRollups.periodStart);

    const recentLogs = await db
      .select({
        id: usageLogs.id,
        status: usageLogs.status,
        latencyMs: usageLogs.latencyMs,
        tokensUsed: usageLogs.tokensUsed,
        createdAt: usageLogs.createdAt,
      })
      .from(usageLogs)
      .where(
        and(
          eq(usageLogs.projectId, id),
          gte(usageLogs.createdAt, startDate)
        )
      )
      .orderBy(desc(usageLogs.createdAt))
      .limit(100);

    const aggregates = await db
      .select({
        totalCalls: sql<number>`count(*)::int`,
        successCalls: sql<number>`count(*) filter (where ${usageLogs.status} = 'success')::int`,
        failedCalls: sql<number>`count(*) filter (where ${usageLogs.status} != 'success')::int`,
        avgLatency: sql<number>`coalesce(avg(${usageLogs.latencyMs}), 0)::int`,
        p50Latency: sql<number>`coalesce(percentile_cont(0.5) within group (order by ${usageLogs.latencyMs}), 0)::int`,
        p95Latency: sql<number>`coalesce(percentile_cont(0.95) within group (order by ${usageLogs.latencyMs}), 0)::int`,
        p99Latency: sql<number>`coalesce(percentile_cont(0.99) within group (order by ${usageLogs.latencyMs}), 0)::int`,
        totalTokens: sql<number>`coalesce(sum(${usageLogs.tokensUsed}), 0)::int`,
      })
      .from(usageLogs)
      .where(
        and(
          eq(usageLogs.projectId, id),
          gte(usageLogs.createdAt, startDate)
        )
      );

    const hourlyData = await db
      .select({
        hour: sql<string>`date_trunc('hour', ${usageLogs.createdAt})::text`,
        calls: sql<number>`count(*)::int`,
        avgLatency: sql<number>`coalesce(avg(${usageLogs.latencyMs}), 0)::int`,
        errors: sql<number>`count(*) filter (where ${usageLogs.status} != 'success')::int`,
      })
      .from(usageLogs)
      .where(
        and(
          eq(usageLogs.projectId, id),
          gte(usageLogs.createdAt, startDate)
        )
      )
      .groupBy(sql`date_trunc('hour', ${usageLogs.createdAt})`)
      .orderBy(sql`date_trunc('hour', ${usageLogs.createdAt})`);

    const summary = aggregates[0] || {
      totalCalls: 0,
      successCalls: 0,
      failedCalls: 0,
      avgLatency: 0,
      p50Latency: 0,
      p95Latency: 0,
      p99Latency: 0,
      totalTokens: 0,
    };

    const errorRate = summary.totalCalls > 0 
      ? ((summary.failedCalls / summary.totalCalls) * 100).toFixed(2)
      : "0.00";

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
      },
      range,
      interval,
      summary: {
        ...summary,
        errorRate: parseFloat(errorRate),
        successRate: summary.totalCalls > 0 
          ? parseFloat(((summary.successCalls / summary.totalCalls) * 100).toFixed(2))
          : 100,
      },
      latencyPercentiles: {
        p50: summary.p50Latency,
        p95: summary.p95Latency,
        p99: summary.p99Latency,
        avg: summary.avgLatency,
      },
      timeSeriesData: hourlyData,
      rollups,
      recentCalls: recentLogs,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
