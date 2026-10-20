import { getSiteUrl } from "@/lib/site-url";
import { getHybridStrategy } from "../hybrid-gtm-strategies";
import { emitOrbitEvent } from "../analytics/event-repository";
import { resolveFusionRunStep } from "./fusion-task-map";
import type { RouteRunContext } from "./route-types";

export type FusionTaskResult = {
  taskId: string;
  runStepId?: string;
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  summary?: string;
  error?: string;
};

export type FusionStepResult = {
  hybridStrategyId: string;
  tasks: FusionTaskResult[];
  completed: number;
  skipped: number;
  failed: number;
};

async function invokeOrbitRunStep(stepId: string): Promise<{ ok: boolean; summary?: string; error?: string }> {
  const base = getSiteUrl();
  const secret = process.env.ORBIT_INTERNAL_SECRET;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) headers["x-internal-secret"] = secret;

  try {
    const res = await fetch(`${base}/api/orbit/run-step`, {
      method: "POST",
      headers,
      body: JSON.stringify({ stepId }),
      signal: AbortSignal.timeout(120_000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: (data as { error?: string }).error || `HTTP ${res.status}` };
    }
    return {
      ok: true,
      summary: typeof (data as { summary?: string }).summary === "string"
        ? (data as { summary: string }).summary.slice(0, 500)
        : undefined,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function runFusionStep(
  ctx: RouteRunContext,
  config: Record<string, unknown>,
): Promise<FusionStepResult> {
  const hybridStrategyId = String(config.hybridStrategyId || config.strategyId || "").trim();
  if (!hybridStrategyId) {
    throw new Error("fusion step requires hybridStrategyId in config");
  }

  const strategy = getHybridStrategy(hybridStrategyId);
  if (!strategy) {
    throw new Error(`Unknown hybrid strategy: ${hybridStrategyId}`);
  }

  const taskIds = (config.taskIds as string[] | undefined)?.length
    ? (config.taskIds as string[])
    : strategy.orbitTaskIds ?? [];

  const tasks: FusionTaskResult[] = [];
  let completed = 0;
  let skipped = 0;
  let failed = 0;

  for (const taskId of taskIds) {
    const runStepId = resolveFusionRunStep(taskId);
    if (!runStepId) {
      skipped += 1;
      tasks.push({
        taskId,
        ok: true,
        skipped: true,
        reason: "manual_or_unmapped",
      });
      continue;
    }

    const result = await invokeOrbitRunStep(runStepId);
    if (result.ok) {
      completed += 1;
      tasks.push({ taskId, runStepId, ok: true, summary: result.summary });
    } else {
      failed += 1;
      tasks.push({ taskId, runStepId, ok: false, error: result.error });
      if (config.stopOnFailure === true) break;
    }
  }

  if (ctx.projectId) {
    await emitOrbitEvent({
      orbitProjectId: ctx.projectId,
      orbitCampaignId: ctx.campaignId,
      routeId: ctx.routeId,
      eventType: "fusion_scene_executed",
      source: "internal",
      idempotencyKey: `fusion:${ctx.routeId}:${hybridStrategyId}:${Date.now()}`,
      dimensions: {
        hybridStrategyId,
        motion: strategy.motion,
        completed,
        skipped,
        failed,
      },
      metadata: { tasks: tasks.map((t) => ({ taskId: t.taskId, ok: t.ok, skipped: t.skipped })) },
    });
  }

  if (failed > 0 && config.allowPartial !== true) {
    throw new Error(`${failed} fusion task(s) failed for strategy ${hybridStrategyId}`);
  }

  return { hybridStrategyId, tasks, completed, skipped, failed };
}
