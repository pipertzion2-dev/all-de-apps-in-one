import { getOrbitProjectById } from "@/lib/orbit/ingest";
import { getOrbitCampaignById } from "@/lib/orbit/campaign/campaign-repository";
import {
  applyRecommendation,
  listOpenRecommendations,
  processProjectAnalytics,
  emitOrbitEvent,
} from "@/lib/orbit/analytics";
import {
  DEFAULT_AUTOPILOT_CONFIG,
  type OrbitApprovalPolicy,
  type OrbitAutopilotConfig,
  type OrbitCampaignMode,
  type OrbitRecommendationKind,
} from "../graph-constants";
import { canAutoApplyRecommendation, resolveCampaignMode } from "./autopilot-policy";
import {
  createAutopilotRun,
  completeAutopilotRun,
} from "./autopilot-repository";
import type { AutopilotActionRecord, AutopilotRunResult, RunAutopilotInput } from "./autopilot-types";
import { parseAutopilotConfig } from "./autopilot-types";

function mergeAutopilotConfig(
  metadata: Record<string, unknown> | null | undefined,
): Required<Pick<OrbitAutopilotConfig, "enabled" | "maxActionsPerRun" | "defaultMode">> {
  const parsed = parseAutopilotConfig(metadata);
  return {
    enabled: parsed.enabled ?? DEFAULT_AUTOPILOT_CONFIG.enabled ?? false,
    maxActionsPerRun: parsed.maxActionsPerRun ?? DEFAULT_AUTOPILOT_CONFIG.maxActionsPerRun ?? 5,
    defaultMode: parsed.defaultMode ?? DEFAULT_AUTOPILOT_CONFIG.defaultMode ?? "assisted",
  };
}

export async function runProjectAutopilot(
  input: RunAutopilotInput,
): Promise<AutopilotRunResult> {
  const project = await getOrbitProjectById(input.projectId, input.userId);
  if (!project) throw new Error("Orbit project not found");

  const config = mergeAutopilotConfig(project.metadata as Record<string, unknown> | null);
  const maxActions = input.maxActions ?? config.maxActionsPerRun;

  if (!config.enabled && !input.force) {
    return {
      runId: "",
      projectId: input.projectId,
      status: "skipped",
      skippedReason: "autopilot_disabled",
      recommendationsSeen: 0,
      recommendationsApplied: 0,
      recommendationsSkipped: 0,
      actions: [],
    };
  }

  const run = await createAutopilotRun({
    orbitProjectId: input.projectId,
    userId: input.userId,
  });

  const actions: AutopilotActionRecord[] = [];
  let applied = 0;
  let skipped = 0;

  try {
    const analytics = await processProjectAnalytics(input.projectId, input.userId);
    const open = await listOpenRecommendations(input.projectId);

    for (const rec of open) {
      if (applied >= maxActions) {
        skipped += 1;
        actions.push({
          recommendationId: rec.id,
          kind: rec.kind,
          ok: false,
          message: "Skipped",
          skippedReason: "max_actions_reached",
        });
        continue;
      }

      let campaignMode: OrbitCampaignMode = config.defaultMode;
      let approvalPolicy: OrbitApprovalPolicy | null = null;

      if (rec.orbitCampaignId) {
        const campaign = await getOrbitCampaignById(rec.orbitCampaignId, input.userId);
        if (campaign) {
          campaignMode = resolveCampaignMode(campaign.mode, config.defaultMode);
          approvalPolicy = (campaign.approvalPolicy as OrbitApprovalPolicy | null) ?? null;
        }
      }

      const gate = canAutoApplyRecommendation({
        kind: rec.kind as OrbitRecommendationKind,
        campaignMode,
        approvalPolicy,
        priority: rec.priority,
      });

      if (!gate.ok) {
        skipped += 1;
        actions.push({
          recommendationId: rec.id,
          kind: rec.kind,
          ok: false,
          message: "Skipped",
          skippedReason: gate.reason,
        });
        continue;
      }

      const result = await applyRecommendation(rec.id, input.userId, "apply");
      applied += 1;
      actions.push({
        recommendationId: rec.id,
        kind: rec.kind,
        ok: result.ok,
        message: result.message,
      });
    }

    await completeAutopilotRun(run.id, {
      status: "completed",
      recommendationsSeen: open.length,
      recommendationsApplied: applied,
      recommendationsSkipped: skipped,
      actions,
    });

    await emitOrbitEvent({
      orbitProjectId: input.projectId,
      eventType: "autopilot_run_completed",
      source: "internal",
      idempotencyKey: `autopilot:${run.id}:completed`,
      dimensions: {
        applied,
        skipped,
        seen: open.length,
      },
      metadata: { runId: run.id },
    });

    return {
      runId: run.id,
      projectId: input.projectId,
      status: "completed",
      recommendationsSeen: open.length,
      recommendationsApplied: applied,
      recommendationsSkipped: skipped,
      actions,
      analytics: {
        backfilledEvents: analytics.backfilledEvents,
        recommendationsCreated: analytics.recommendations.created,
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await completeAutopilotRun(run.id, {
      status: "failed",
      recommendationsSeen: actions.length,
      recommendationsApplied: applied,
      recommendationsSkipped: skipped,
      actions,
      errorMessage: message,
    });
    return {
      runId: run.id,
      projectId: input.projectId,
      status: "failed",
      recommendationsSeen: actions.length,
      recommendationsApplied: applied,
      recommendationsSkipped: skipped,
      actions,
    };
  }
}

export async function getProjectAutopilotStatus(projectId: string, userId: string) {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const config = mergeAutopilotConfig(project.metadata as Record<string, unknown> | null);
  const { getLatestAutopilotRun } = await import("./autopilot-repository");
  const lastRun = await getLatestAutopilotRun(projectId);

  return {
    projectId,
    config,
    lastRun: lastRun
      ? {
          id: lastRun.id,
          status: lastRun.status,
          recommendationsApplied: lastRun.recommendationsApplied,
          recommendationsSkipped: lastRun.recommendationsSkipped,
          completedAt: lastRun.completedAt,
          actions: lastRun.actions,
        }
      : null,
  };
}

export async function updateProjectAutopilotConfig(
  projectId: string,
  userId: string,
  patch: Partial<OrbitAutopilotConfig>,
) {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const meta = (project.metadata || {}) as Record<string, unknown>;
  const current = parseAutopilotConfig(meta);
  const next = { ...current, ...patch };

  const { db } = await import("@/lib/db");
  const { orbitProjects } = await import("@/lib/orbit/schema");
  const { eq, and } = await import("drizzle-orm");

  await db
    .update(orbitProjects)
    .set({
      metadata: { ...meta, autopilot: next },
      updatedAt: new Date(),
    })
    .where(and(eq(orbitProjects.id, projectId), eq(orbitProjects.userId, userId)));

  return mergeAutopilotConfig({ autopilot: next });
}
