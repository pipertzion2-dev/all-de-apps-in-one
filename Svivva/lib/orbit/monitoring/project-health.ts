import { getOrbitProjectById } from "@/lib/orbit/ingest";
import { listIndexRecordsForProject } from "../indexing/index-repository";
import { listOpenRecommendations } from "../analytics/recommendation-repository";
import { listDistributionJobsForProject } from "../distribution/distribution-repository";
import { getLatestAutopilotRun } from "../autopilot/autopilot-repository";
import { getLatestSchedulerRun } from "../scheduler/scheduler-repository";
import { parseExternalAnalyticsConfig } from "../analytics/external-signals";
import { parseAutopilotConfig } from "../autopilot/autopilot-types";
import { mergeSchedulerConfig } from "../scheduler/scheduler-types";
import { parseSeoOpsSnapshot } from "../routes/seo-ops-gate";
import { parseIfmConfig } from "../ifm/ifm-repository";
import { parseRoadmapConfig } from "../roadmap/roadmap-repository";

export type ProjectHealthAlert = {
  level: "info" | "warning" | "critical";
  code: string;
  message: string;
};

export type ProjectHealthSnapshot = {
  projectId: string;
  status: "healthy" | "degraded" | "critical";
  alerts: ProjectHealthAlert[];
  indexing: { total: number; stuckSubmitted: number; failed: number };
  distribution: { pending: number; failed: number };
  recommendations: { open: number; highPriority: number };
  autopilot: { enabled: boolean; lastRunStatus: string | null };
  scheduler: { enabled: boolean };
  seoOps: {
    lastCheckedAt?: string;
    ok?: boolean;
    issueCount?: number;
    indexHealthScore?: number;
  };
  externalAnalytics: { hasData: boolean; sessions7d?: number; conversions7d?: number };
  ifm: {
    enabled: boolean;
    winners: number;
    roadmapBacklog: number;
    staleCompoundDays?: number;
  };
};

const MS_DAY = 24 * 60 * 60 * 1000;

export async function buildProjectHealthSnapshot(
  projectId: string,
  userId: string,
): Promise<ProjectHealthSnapshot> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const meta = (project.metadata || {}) as Record<string, unknown>;
  const alerts: ProjectHealthAlert[] = [];

  const indexRecords = await listIndexRecordsForProject(projectId);
  const threeDaysAgo = Date.now() - 3 * MS_DAY;
  const stuckSubmitted = indexRecords.filter(
    (r) =>
      r.status === "submitted" &&
      r.submittedAt &&
      new Date(r.submittedAt).getTime() < threeDaysAgo,
  ).length;
  const indexFailed = indexRecords.filter(
    (r) => r.status === "failed" || r.status === "not_indexed",
  ).length;

  if (stuckSubmitted > 0) {
    alerts.push({
      level: "warning",
      code: "index_stuck_submitted",
      message: `${stuckSubmitted} URL(s) stuck in submitted state for 3+ days`,
    });
  }
  if (indexFailed > 2) {
    alerts.push({
      level: "critical",
      code: "index_failures",
      message: `${indexFailed} index records failed or not indexed`,
    });
  }

  const jobs = await listDistributionJobsForProject(projectId);
  const pendingJobs = jobs.filter((j) => j.status === "pending").length;
  const failedJobs = jobs.filter((j) => j.status === "failed").length;
  if (failedJobs > 0) {
    alerts.push({
      level: failedJobs >= 3 ? "critical" : "warning",
      code: "distribution_failures",
      message: `${failedJobs} failed distribution job(s)`,
    });
  }
  if (pendingJobs > 10) {
    alerts.push({
      level: "warning",
      code: "distribution_backlog",
      message: `${pendingJobs} jobs pending in distribution queue`,
    });
  }

  const openRecs = await listOpenRecommendations(projectId);
  const highPriority = openRecs.filter((r) => r.priority === "high").length;
  if (highPriority > 0) {
    alerts.push({
      level: "warning",
      code: "high_priority_recommendations",
      message: `${highPriority} high-priority recommendation(s) open`,
    });
  }

  const autopilotConfig = parseAutopilotConfig(meta);
  const autopilotRun = await getLatestAutopilotRun(projectId);
  if (autopilotConfig.enabled && autopilotRun?.status === "failed") {
    alerts.push({
      level: "critical",
      code: "autopilot_failed",
      message: autopilotRun.errorMessage || "Last autopilot run failed",
    });
  }

  const external = parseExternalAnalyticsConfig(meta);
  if (
    external.sessions7d != null &&
    external.previousSessions7d != null &&
    external.previousSessions7d > 0 &&
    external.sessions7d < external.previousSessions7d * 0.7
  ) {
    alerts.push({
      level: "critical",
      code: "traffic_drop",
      message: "Session count dropped more than 30% vs previous period",
    });
  }

  const schedulerConfig = mergeSchedulerConfig(meta);
  const globalScheduler = await getLatestSchedulerRun();
  if (schedulerConfig.enabled && globalScheduler?.status === "failed") {
    alerts.push({
      level: "warning",
      code: "scheduler_failed",
      message: globalScheduler.errorMessage || "Last global scheduler run failed",
    });
  }

  const seoOps = parseSeoOpsSnapshot(meta);
  if (seoOps && !seoOps.ok) {
    alerts.push({
      level: "warning",
      code: "seo_ops_gate_failed",
      message: seoOps.issues.slice(0, 2).join("; ") || "SEO ops gate failed",
    });
  }

  const ifmConfig = parseIfmConfig(meta);
  const roadmapConfig = parseRoadmapConfig(meta);
  const ifmWinners = (ifmConfig.pairings ?? []).filter((p) => p.status === "winner").length;
  const roadmapBacklog = (roadmapConfig.items ?? []).filter(
    (i) => i.status === "proposed" || i.status === "approved",
  ).length;

  if (ifmConfig.enabled && ifmWinners > 0 && roadmapBacklog === 0) {
    alerts.push({
      level: "info",
      code: "ifm_winners_not_on_roadmap",
      message: `${ifmWinners} IFM winner(s) not yet promoted to product roadmap`,
    });
  }

  if (ifmConfig.enabled && ifmConfig.lastCompoundedAt) {
    const compoundAge = Date.now() - new Date(ifmConfig.lastCompoundedAt).getTime();
    if (compoundAge > 14 * MS_DAY) {
      alerts.push({
        level: "warning",
        code: "ifm_compound_stale",
        message: "IFM winner compounding has not run in 14+ days",
      });
    }
  }

  if (
    ifmConfig.enabled &&
    parseExternalAnalyticsConfig(meta).ga4PropertyId &&
    !parseExternalAnalyticsConfig(meta).lastSyncedAt
  ) {
    alerts.push({
      level: "warning",
      code: "ifm_ga4_not_synced",
      message: "GA4 property configured but external analytics never synced",
    });
  }

  let status: ProjectHealthSnapshot["status"] = "healthy";
  if (alerts.some((a) => a.level === "critical")) status = "critical";
  else if (alerts.length > 0) status = "degraded";

  return {
    projectId,
    status,
    alerts,
    indexing: { total: indexRecords.length, stuckSubmitted, failed: indexFailed },
    distribution: { pending: pendingJobs, failed: failedJobs },
    recommendations: { open: openRecs.length, highPriority },
    autopilot: {
      enabled: autopilotConfig.enabled ?? false,
      lastRunStatus: autopilotRun?.status ?? null,
    },
    scheduler: { enabled: schedulerConfig.enabled },
    seoOps: {
      lastCheckedAt: seoOps?.checkedAt,
      ok: seoOps?.ok,
      issueCount: seoOps?.issues.length,
      indexHealthScore: seoOps?.checks.indexHealthScore,
    },
    externalAnalytics: {
      hasData: external.lastSyncedAt != null,
      sessions7d: external.sessions7d,
      conversions7d: external.conversions7d,
    },
    ifm: {
      enabled: ifmConfig.enabled ?? false,
      winners: ifmWinners,
      roadmapBacklog,
      staleCompoundDays: ifmConfig.lastCompoundedAt
        ? Math.floor(
            (Date.now() - new Date(ifmConfig.lastCompoundedAt).getTime()) / MS_DAY,
          )
        : undefined,
    },
  };
}
