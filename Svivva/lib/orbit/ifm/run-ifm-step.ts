import { emitOrbitEvent } from "../analytics/event-repository";
import { generateIfmPairings, pairKey } from "./intent-fusion-matrix";
import { NATIVE_SVIVVA_TOOLS } from "../mini-app-curation";
import {
  appendIfmPairings,
  getIfmPairingsForProject,
  persistIfmPairingEntities,
} from "./ifm-repository";
import type { IfmStepResult } from "./ifm-types";
import type { RouteRunContext } from "../routes/route-types";

export async function runIfmStep(
  ctx: RouteRunContext,
  config: Record<string, unknown>,
): Promise<IfmStepResult> {
  if (!ctx.projectId) {
    throw new Error("projectId required for ifm step");
  }

  const pairCount = Math.min(Math.max(Number(config.pairCount) || 3, 1), 10);
  const existing = await getIfmPairingsForProject(ctx.projectId, ctx.userId);
  const excludePairKeys = existing.map((p) => {
    const a = NATIVE_SVIVVA_TOOLS.find((t) => t.path === p.toolA.path);
    const b = NATIVE_SVIVVA_TOOLS.find((t) => t.path === p.toolB.path);
    if (a && b) return pairKey(a, b);
    return `${p.toolA.path}|${p.toolB.path}`;
  });

  const pairings = generateIfmPairings({
    count: pairCount,
    excludePairKeys,
    weekSeed: String(config.weekSeed || new Date().toISOString().slice(0, 10)),
  });

  if (!pairings.length) {
    return { pairings: [], created: 0, skipped: pairCount };
  }

  await appendIfmPairings(ctx.projectId, ctx.userId, pairings);

  for (const pairing of pairings) {
    await persistIfmPairingEntities(ctx.projectId, pairing);
    await emitOrbitEvent({
      orbitProjectId: ctx.projectId,
      orbitCampaignId: ctx.campaignId,
      routeId: ctx.routeId,
      eventType: "ifm_pair_generated",
      source: "internal",
      idempotencyKey: `ifm:${ctx.projectId}:${pairing.id}`,
      dimensions: {
        fusionTitle: pairing.fusionTitle,
        toolA: pairing.toolA.path,
        toolB: pairing.toolB.path,
        hubA: pairing.toolA.hub,
        hubB: pairing.toolB.hub,
      },
      metadata: { pairingId: pairing.id, slug: pairing.slug },
    });
  }

  await emitOrbitEvent({
    orbitProjectId: ctx.projectId,
    orbitCampaignId: ctx.campaignId,
    routeId: ctx.routeId,
    eventType: "ifm_bridge_planned",
    source: "internal",
    idempotencyKey: `ifm:${ctx.projectId}:batch:${Date.now()}`,
    dimensions: { created: pairings.length, pairCount },
  });

  return { pairings, created: pairings.length, skipped: pairCount - pairings.length };
}
