import { approveRoadmapItems } from "./roadmap-approval";
import type { RouteRunContext } from "../routes/route-types";

export async function runRoadmapApproveStep(
  ctx: RouteRunContext,
  config: Record<string, unknown>,
): Promise<{ approved: number; skipped: number }> {
  if (!ctx.projectId) throw new Error("projectId required for roadmap_approve step");

  const result = await approveRoadmapItems(ctx.projectId, ctx.userId, {
    scoreThreshold: config.scoreThreshold as number | undefined,
    force: config.force === true,
  });

  return { approved: result.approved, skipped: result.skipped };
}
