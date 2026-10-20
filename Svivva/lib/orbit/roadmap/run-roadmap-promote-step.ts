import { promoteIfmWinnersToRoadmap } from "./promote-ifm-winner";
import type { RouteRunContext } from "../routes/route-types";

export async function runRoadmapPromoteStep(
  ctx: RouteRunContext,
  config: Record<string, unknown>,
) {
  if (!ctx.projectId) throw new Error("projectId required for roadmap_promote step");

  return promoteIfmWinnersToRoadmap(ctx.projectId, ctx.userId, {
    scoreThreshold: Number(config.scoreThreshold) || undefined,
    requireConversions: config.requireConversions === true,
    maxPromote: Number(config.maxPromote) || 3,
  });
}
