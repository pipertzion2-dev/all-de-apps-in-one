import { listReadyOrbitProjectsForScheduler } from "@/lib/orbit/ingest";
import { runIndexRecheck } from "@/lib/orbit/indexing/run-recheck";
import { processDistributionQueue } from "@/lib/orbit/distribution/run-distribute";
import { processProjectAnalytics, emitOrbitEvent } from "@/lib/orbit/analytics";
import { runProjectAutopilot, parseAutopilotConfig } from "@/lib/orbit/autopilot";
import { syncExternalSignalsForProject } from "@/lib/orbit/analytics/external-signals";
import { createSchedulerRun, completeSchedulerRun } from "./scheduler-repository";
import type { SchedulerProjectResult, SchedulerRunResult } from "./scheduler-types";
import { mergeSchedulerConfig } from "./scheduler-types";

export type RunOrbitSchedulerInput = {
  maxProjects?: number;
  runAutopilot?: boolean;
  skipGlobalSteps?: boolean;
};

export async function runOrbitScheduler(
  input: RunOrbitSchedulerInput = {},
): Promise<SchedulerRunResult> {
  const run = await createSchedulerRun();
  const projectResults: SchedulerProjectResult[] = [];

  let indexRecheck: Record<string, unknown> = {};
  let distribution: Record<string, unknown> = {};

  try {
    if (!input.skipGlobalSteps) {
      const recheck = await runIndexRecheck(50);
      indexRecheck = recheck as unknown as Record<string, unknown>;

      const dist = await processDistributionQueue({ limit: 15 });
      distribution = dist as unknown as Record<string, unknown>;
    }

    const globalConfig = mergeSchedulerConfig(null);
    const maxProjects = input.maxProjects ?? globalConfig.maxProjectsPerRun;
    const shouldRunAutopilot = input.runAutopilot ?? globalConfig.runAutopilot;

    const projects = await listReadyOrbitProjectsForScheduler(maxProjects);

    for (const project of projects) {
      const meta = (project.metadata || {}) as Record<string, unknown>;
      const schedulerConfig = mergeSchedulerConfig(meta);
      if (!schedulerConfig.enabled) continue;

      const result: SchedulerProjectResult = {
        projectId: project.id,
        projectName: project.name,
        userId: project.userId,
      };

      try {
        const { pullGa4MetricsForProject } = await import("../analytics/ga4-data-api");
        result.externalSignals = {
          ...(await syncExternalSignalsForProject(project.id, project.userId)),
          ga4: await pullGa4MetricsForProject(project.id, project.userId),
        };
        result.analytics = await processProjectAnalytics(project.id, project.userId);

        const autopilotConfig = parseAutopilotConfig(meta);
        if (shouldRunAutopilot && autopilotConfig.enabled) {
          result.autopilot = await runProjectAutopilot({
            projectId: project.id,
            userId: project.userId,
          });
        }

        projectResults.push(result);
      } catch (e) {
        result.error = e instanceof Error ? e.message : String(e);
        projectResults.push(result);
      }
    }

    await completeSchedulerRun(run.id, {
      status: "completed",
      projectsSeen: projects.length,
      projectsProcessed: projectResults.length,
      indexRecheck,
      distribution,
      projectResults,
    });

    const eventProjectId = projectResults[0]?.projectId || projects[0]?.id;
    if (eventProjectId) {
      await emitOrbitEvent({
        orbitProjectId: eventProjectId,
        eventType: "scheduler_run_completed",
        source: "internal",
        idempotencyKey: `scheduler:${run.id}:completed`,
        dimensions: {
          projectsSeen: projects.length,
          projectsProcessed: projectResults.length,
        },
        metadata: { runId: run.id },
      });
    }

    const { runActiveOrbitRoutes } = await import("../routes/route-runner");
    const routeResults = await runActiveOrbitRoutes(5);

    return {
      runId: run.id,
      status: "completed" as const,
      projectsSeen: projects.length,
      projectsProcessed: projectResults.length,
      indexRecheck,
      distribution,
      projectResults,
      routeResults,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await completeSchedulerRun(run.id, {
      status: "failed",
      projectsSeen: 0,
      projectsProcessed: projectResults.length,
      indexRecheck,
      distribution,
      projectResults,
      errorMessage: message,
    });
    return {
      runId: run.id,
      status: "failed",
      projectsSeen: 0,
      projectsProcessed: projectResults.length,
      indexRecheck,
      distribution,
      projectResults,
      errorMessage: message,
    };
  }
}

export async function getSchedulerStatus() {
  const { getLatestSchedulerRun } = await import("./scheduler-repository");
  const lastRun = await getLatestSchedulerRun();
  return {
    lastRun: lastRun
      ? {
          id: lastRun.id,
          status: lastRun.status,
          projectsSeen: lastRun.projectsSeen,
          projectsProcessed: lastRun.projectsProcessed,
          completedAt: lastRun.completedAt,
          errorMessage: lastRun.errorMessage,
        }
      : null,
  };
}
