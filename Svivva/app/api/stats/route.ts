import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects, usageLogs, evalRuns, evalSuites } from "@/lib/schema";
import { eq, and, gte, sql, count, inArray } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [projectCount] = await db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.ownerId, user.id));

    const userProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.ownerId, user.id));

    const projectIds = userProjects.map((p) => p.id);

    let apiCalls24h = 0;
    let avgPassRate: number | null = null;

    if (projectIds.length > 0) {
      const [usageResult] = await db
        .select({ count: count() })
        .from(usageLogs)
        .where(and(inArray(usageLogs.projectId, projectIds), gte(usageLogs.createdAt, yesterday)));
      apiCalls24h = usageResult?.count || 0;

      const userSuites = await db
        .select({ id: evalSuites.id })
        .from(evalSuites)
        .where(inArray(evalSuites.projectId, projectIds));

      const suiteIds = userSuites.map((s) => s.id);

      if (suiteIds.length > 0) {
        const evalResults = await db
          .select({
            passedCases: evalRuns.passedCases,
            totalCases: evalRuns.totalCases,
          })
          .from(evalRuns)
          .where(inArray(evalRuns.suiteId, suiteIds))
          .orderBy(sql`${evalRuns.createdAt} DESC`)
          .limit(10);

        if (evalResults.length > 0) {
          let totalPassed = 0;
          let totalCases = 0;
          for (const r of evalResults) {
            totalPassed += r.passedCases || 0;
            totalCases += r.totalCases || 0;
          }
          avgPassRate = totalCases > 0 ? Math.round((totalPassed / totalCases) * 100) : null;
        }
      }
    }

    return NextResponse.json({
      projectCount: projectCount?.count || 0,
      apiCalls24h,
      avgPassRate,
    });
  } catch (error: any) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
