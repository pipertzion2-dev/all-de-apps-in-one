import { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { growthTasks } from "@/lib/schema";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import {
  buildGrowthIntelligenceReport,
  formatGrowthIntelSummary,
  type GrowthIntelligenceReport,
} from "@/lib/orbit/growth-intelligence";
import { forbidden, ok } from "@/lib/http-response";

export const dynamic = "force-dynamic";

const TASK_TYPE = "growth_intelligence_daily";

async function loadLatestReport(): Promise<GrowthIntelligenceReport | null> {
  try {
    const rows = await db
      .select()
      .from(growthTasks)
      .where(eq(growthTasks.taskType, TASK_TYPE))
      .orderBy(desc(growthTasks.runAt))
      .limit(1);
    const row = rows[0];
    const details = row?.details as { report?: GrowthIntelligenceReport } | null;
    if (details?.report?.version) return details.report;
  } catch {
    /* DB optional on first run */
  }
  return null;
}

/** GET — latest saved report, or seeded report if none exists */
export async function GET() {
  if (!(await isOrbitAdminAllowed())) return forbidden();

  const saved = await loadLatestReport();
  const report = saved ?? buildGrowthIntelligenceReport();
  return ok({
    report,
    summary: formatGrowthIntelSummary(report),
    source: saved ? "database" : "seed",
    implemented: true,
    agent: "orbit_growth_intelligence",
  });
}

/** POST — refresh report and persist to growth_tasks */
export async function POST(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) return forbidden();

  const report = buildGrowthIntelligenceReport();
  const summary = formatGrowthIntelSummary(report);

  try {
    await db.insert(growthTasks).values({
      taskType: TASK_TYPE,
      product: "orbit",
      status: "completed",
      details: { report, summary },
    });
  } catch (e) {
    return ok({
      report,
      summary,
      source: "generated",
      implemented: true,
      persisted: false,
      warning: String(e),
    });
  }

  return ok({
    report,
    summary,
    source: "generated",
    implemented: true,
    persisted: true,
    generatedAt: report.generatedAt,
  });
}
