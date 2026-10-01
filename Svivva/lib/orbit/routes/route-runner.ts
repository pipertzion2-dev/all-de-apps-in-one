import type { OrbitRoute } from "@/lib/orbit/schema";
import type { OrbitRouteChannel } from "../graph-constants";
import type { PlanCampaignInput } from "../campaign/plan-types";
import { emitOrbitEvent } from "../analytics/event-repository";
import {
  getOrbitRouteById,
  markRouteRunning,
  completeRouteRun,
} from "./route-repository";
import type { RouteRunContext, RouteRunResult, RouteStepResult } from "./route-types";
import { sortDestinations } from "./route-types";
import { isOrbitRouteChannel } from "./route-templates";

async function executeRouteStep(
  channel: OrbitRouteChannel,
  ctx: RouteRunContext,
  route: OrbitRoute,
  config: Record<string, unknown> = {},
): Promise<unknown> {
  switch (channel) {
    case "ingest": {
      const { runOrbitIngest } = await import("../ingest/run-ingest");
      if (!route.sourceRef) throw new Error("Route sourceRef required for ingest step");
      const result = await runOrbitIngest({
        userId: ctx.userId,
        sourceType: route.sourceChannel as Parameters<typeof runOrbitIngest>[0]["sourceType"],
        sourceRef: route.sourceRef,
        manual:
          route.sourceChannel === "manual" || route.sourceChannel === "campaign"
            ? {
                name: route.name || "Route ingest",
                description: route.description || undefined,
              }
            : undefined,
      });
      ctx.projectId = result.projectId;
      return result;
    }
    case "plan": {
      if (!ctx.projectId) throw new Error("projectId required for plan step");
      const { planCampaignForProject } = await import("../campaign/run-plan");
      const planInput: PlanCampaignInput = {
        mode: (config.mode as PlanCampaignInput["mode"]) || "assisted",
        objective: config.objective as PlanCampaignInput["objective"],
      };
      const result = await planCampaignForProject(ctx.projectId, ctx.userId, planInput);
      ctx.campaignId = result.campaign.id;
      return result;
    }
    case "generate": {
      if (!ctx.campaignId) throw new Error("campaignId required for generate step");
      const { generateCampaignAssets } = await import("../content/run-generate");
      return generateCampaignAssets({
        campaignId: ctx.campaignId,
        userId: ctx.userId,
        templateOnly: config.templateOnly !== false,
        regenerate: config.regenerate === true,
      });
    }
    case "index_submit": {
      if (!ctx.projectId) throw new Error("projectId required for index_submit step");
      const { runProjectIndexSubmit } = await import("../indexing/run-index");
      return runProjectIndexSubmit({
        projectId: ctx.projectId,
        userId: ctx.userId,
        campaignId: ctx.campaignId,
        probeFirst: config.probeFirst !== false,
      });
    }
    case "distribute": {
      if (!ctx.campaignId) throw new Error("campaignId required for distribute step");
      const { enqueueCampaignDistribution } = await import("../distribution/run-enqueue");
      return enqueueCampaignDistribution({
        campaignId: ctx.campaignId,
        userId: ctx.userId,
        processNow: config.processNow === true,
      });
    }
    case "analytics": {
      if (!ctx.projectId) throw new Error("projectId required for analytics step");
      const { processProjectAnalytics } = await import("../analytics/run-analytics-process");
      return processProjectAnalytics(ctx.projectId, ctx.userId);
    }
    case "autopilot": {
      if (!ctx.projectId) throw new Error("projectId required for autopilot step");
      const { runProjectAutopilot } = await import("../autopilot/run-autopilot");
      return runProjectAutopilot({
        projectId: ctx.projectId,
        userId: ctx.userId,
        force: config.force === true,
      });
    }
    default: {
      const _exhaustive: never = channel;
      throw new Error(`Unknown route channel: ${_exhaustive}`);
    }
  }
}

export async function runOrbitRoute(routeId: string, userId: string): Promise<RouteRunResult> {
  const route = await getOrbitRouteById(routeId, userId);
  if (!route) throw new Error("Route not found");

  await markRouteRunning(routeId, userId);

  const ctx: RouteRunContext = {
    userId,
    routeId,
    projectId: route.orbitProjectId ?? undefined,
    campaignId: undefined,
  };

  const runId = crypto.randomUUID();
  const steps: RouteStepResult[] = [];
  const destinations = sortDestinations(route.destinations || []);

  try {
    for (const dest of destinations) {
      if (!isOrbitRouteChannel(dest.channel)) {
        throw new Error(`Invalid route channel: ${dest.channel}`);
      }

      const started = Date.now();
      try {
        const result = await executeRouteStep(
          dest.channel,
          ctx,
          route,
          (dest.config || {}) as Record<string, unknown>,
        );
        const step: RouteStepResult = {
          channel: dest.channel,
          order: dest.order,
          ok: true,
          result,
          durationMs: Date.now() - started,
        };
        steps.push(step);

        if (ctx.projectId) {
          await emitOrbitEvent({
            orbitProjectId: ctx.projectId,
            orbitCampaignId: ctx.campaignId,
            routeId: route.id,
            eventType: "route_step_completed",
            source: "internal",
            idempotencyKey: `route:${route.id}:run:${runId}:step:${dest.order}:${dest.channel}`,
            dimensions: { channel: dest.channel, order: dest.order },
          });
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        steps.push({
          channel: dest.channel,
          order: dest.order,
          ok: false,
          error: message,
          durationMs: Date.now() - started,
        });
        throw e;
      }
    }

    const runResult: RouteRunResult = {
      routeId,
      status: "completed",
      projectId: ctx.projectId,
      campaignId: ctx.campaignId,
      steps,
    };

    await completeRouteRun(routeId, userId, {
      status: "active",
      lastRunResult: runResult as unknown as Record<string, unknown>,
      lastError: null,
      orbitProjectId: ctx.projectId,
    });

    if (ctx.projectId) {
      await emitOrbitEvent({
        orbitProjectId: ctx.projectId,
        orbitCampaignId: ctx.campaignId,
        routeId: route.id,
        eventType: "route_run_completed",
        source: "internal",
        idempotencyKey: `route:${route.id}:run:${runId}:completed`,
        dimensions: { stepCount: steps.length, status: "completed" },
        metadata: { routeId: route.id },
      });
    }

    return runResult;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const runResult: RouteRunResult = {
      routeId,
      status: "failed",
      projectId: ctx.projectId,
      campaignId: ctx.campaignId,
      steps,
      error: message,
    };

    await completeRouteRun(routeId, userId, {
      status: "failed",
      lastRunResult: runResult as unknown as Record<string, unknown>,
      lastError: message,
      orbitProjectId: ctx.projectId,
    });

    if (ctx.projectId) {
      await emitOrbitEvent({
        orbitProjectId: ctx.projectId,
        orbitCampaignId: ctx.campaignId,
        routeId: route.id,
        eventType: "route_run_completed",
        source: "internal",
        idempotencyKey: `route:${route.id}:run:${runId}:failed`,
        dimensions: { stepCount: steps.length, status: "failed" },
        metadata: { routeId: route.id, error: message },
      });
    }

    return runResult;
  }
}

export async function runActiveOrbitRoutes(limit = 5): Promise<RouteRunResult[]> {
  const { listActiveOrbitRoutes } = await import("./route-repository");
  const routes = await listActiveOrbitRoutes(limit);
  const results: RouteRunResult[] = [];

  for (const route of routes) {
    try {
      const result = await runOrbitRoute(route.id, route.userId);
      results.push(result);
    } catch (e) {
      results.push({
        routeId: route.id,
        status: "failed",
        projectId: route.orbitProjectId ?? undefined,
        steps: [],
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return results;
}
