import type { OrbitRoute } from "@/lib/orbit/schema";
import type { OrbitRouteChannel } from "../graph-constants";
import type { PlanCampaignInput } from "../campaign/plan-types";
import { emitOrbitEvent } from "../analytics/event-repository";
import { getOrbitCampaignById } from "../campaign/campaign-repository";
import { assertCampaignInWindow, CampaignWindowError } from "../campaign/campaign-scheduler";
import {
  getOrbitRouteById,
  markRouteRunning,
  completeRouteRun,
  getRoutePauseState,
  saveRoutePauseState,
  clearRoutePauseState,
} from "./route-repository";
import type {
  RouteRunContext,
  RouteRunResult,
  RouteStepResult,
  RunOrbitRouteOptions,
} from "./route-types";
import { sortDestinations } from "./route-types";
import { isOrbitRouteChannel } from "./route-templates";
import {
  assertRouteApprovalGate,
  RouteAwaitingApprovalError,
} from "./route-approval";
import {
  computeRouteRetryDelay,
  shouldRetryStep,
  sleepMs,
  type RouteRetryPolicy,
} from "./route-retry";

async function executeRouteStep(
  channel: OrbitRouteChannel,
  ctx: RouteRunContext,
  route: OrbitRoute,
  config: Record<string, unknown> = {},
): Promise<unknown> {
  if (ctx.campaignId) {
    const campaign = await getOrbitCampaignById(ctx.campaignId, ctx.userId);
    if (campaign) assertCampaignInWindow(campaign);
  }

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
        durationDays: (config.durationDays as number) || 30,
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
    case "approval": {
      if (!ctx.campaignId) throw new Error("campaignId required for approval step");
      await assertRouteApprovalGate({ campaignId: ctx.campaignId, userId: ctx.userId });
      return { ok: true, approved: true };
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
      const result = await enqueueCampaignDistribution({
        campaignId: ctx.campaignId,
        userId: ctx.userId,
        processNow: config.processNow === true,
        strict: config.failIfUnapproved !== false,
      });
      if (config.failIfUnapproved !== false && result.enqueued === 0 && result.skipped > 0) {
        throw new Error("No assets enqueued — approval or policy may be blocking distribution");
      }
      return result;
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

async function runStepWithRetry(
  dest: { channel: string; order: number; config?: Record<string, unknown> },
  ctx: RouteRunContext,
  route: OrbitRoute,
  retryPolicy: RouteRetryPolicy,
): Promise<RouteStepResult> {
  const channel = dest.channel as OrbitRouteChannel;
  const config = (dest.config || {}) as Record<string, unknown>;
  let attempt = 0;
  const started = Date.now();

  while (true) {
    attempt += 1;
    try {
      const result = await executeRouteStep(channel, ctx, route, config);
      return {
        channel,
        order: dest.order,
        ok: true,
        result,
        attempts: attempt,
        durationMs: Date.now() - started,
      };
    } catch (e) {
      if (e instanceof RouteAwaitingApprovalError || e instanceof CampaignWindowError) {
        throw e;
      }
      if (!shouldRetryStep(attempt, retryPolicy)) {
        return {
          channel,
          order: dest.order,
          ok: false,
          error: e instanceof Error ? e.message : String(e),
          attempts: attempt,
          durationMs: Date.now() - started,
        };
      }
      await sleepMs(computeRouteRetryDelay(attempt, retryPolicy));
    }
  }
}

async function pauseRoute(
  route: OrbitRoute,
  userId: string,
  runId: string,
  fromOrder: number,
  ctx: RouteRunContext,
  reason: string,
  steps: RouteStepResult[],
): Promise<RouteRunResult> {
  await saveRoutePauseState(route.id, userId, {
    fromOrder,
    runId,
    context: { projectId: ctx.projectId, campaignId: ctx.campaignId },
    reason,
  });

  const runResult: RouteRunResult = {
    routeId: route.id,
    status: "paused",
    projectId: ctx.projectId,
    campaignId: ctx.campaignId,
    steps,
    pausedReason: reason,
  };

  await completeRouteRun(route.id, userId, {
    status: "paused",
    lastRunResult: runResult as unknown as Record<string, unknown>,
    lastError: reason,
    orbitProjectId: ctx.projectId,
  });

  if (ctx.projectId) {
    await emitOrbitEvent({
      orbitProjectId: ctx.projectId,
      orbitCampaignId: ctx.campaignId,
      routeId: route.id,
      eventType: "route_awaiting_approval",
      source: "internal",
      idempotencyKey: `route:${route.id}:run:${runId}:paused`,
      dimensions: { fromOrder, reason },
      metadata: { routeId: route.id },
    });
  }

  return runResult;
}

export async function runOrbitRoute(
  routeId: string,
  userId: string,
  options: RunOrbitRouteOptions = {},
): Promise<RouteRunResult> {
  const route = await getOrbitRouteById(routeId, userId);
  if (!route) throw new Error("Route not found");

  const pauseState = getRoutePauseState(route);
  const resumeFromOrder = options.resume && pauseState ? pauseState.fromOrder : undefined;

  if (options.resume) {
    await clearRoutePauseState(routeId, userId);
  }

  await markRouteRunning(routeId, userId);

  const ctx: RouteRunContext = {
    userId,
    routeId,
    projectId: pauseState?.context.projectId ?? route.orbitProjectId ?? undefined,
    campaignId: pauseState?.context.campaignId,
  };

  const runId = pauseState?.runId || crypto.randomUUID();
  const steps: RouteStepResult[] = [];
  const destinations = sortDestinations(route.destinations || []);
  const retryPolicy = (route.retryPolicy as RouteRetryPolicy | null) || {
    maxAttempts: 3,
    backoffMs: 1000,
  };

  try {
    for (const dest of destinations) {
      if (resumeFromOrder != null && dest.order < resumeFromOrder) {
        continue;
      }

      if (!isOrbitRouteChannel(dest.channel)) {
        throw new Error(`Invalid route channel: ${dest.channel}`);
      }

      try {
        const step = await runStepWithRetry(dest, ctx, route, retryPolicy);
        if (!step.ok) {
          steps.push(step);
          throw new Error(step.error || "Step failed");
        }
        steps.push(step);

        if (ctx.projectId) {
          await emitOrbitEvent({
            orbitProjectId: ctx.projectId,
            orbitCampaignId: ctx.campaignId,
            routeId: route.id,
            eventType: "route_step_completed",
            source: "internal",
            idempotencyKey: `route:${route.id}:run:${runId}:step:${dest.order}:${dest.channel}`,
            dimensions: { channel: dest.channel, order: dest.order, attempts: step.attempts },
          });
        }
      } catch (e) {
        if (e instanceof RouteAwaitingApprovalError) {
          steps.push({
            channel: dest.channel as OrbitRouteChannel,
            order: dest.order,
            ok: false,
            error: e.message,
            skippedReason: "awaiting_approval",
            durationMs: 0,
          });
          return pauseRoute(route, userId, runId, dest.order, ctx, e.message, steps);
        }
        if (e instanceof CampaignWindowError) {
          steps.push({
            channel: dest.channel as OrbitRouteChannel,
            order: dest.order,
            ok: false,
            error: e.message,
            skippedReason: "campaign_window",
            durationMs: 0,
          });
          return pauseRoute(route, userId, runId, dest.order, ctx, e.message, steps);
        }
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
      const paused = getRoutePauseState(route);
      const result = await runOrbitRoute(route.id, route.userId, { resume: Boolean(paused) });
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
