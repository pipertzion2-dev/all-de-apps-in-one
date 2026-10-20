import { shipApprovedRoadmapItems } from "./ship-fusion-product";
import type { RouteRunContext } from "../routes/route-types";

export async function runRoadmapProductShipStep(
  ctx: RouteRunContext,
  config: Record<string, unknown>,
): Promise<{ shipped: number; skipped: number }> {
  if (!ctx.projectId) throw new Error("projectId required for roadmap_product_ship step");

  const result = await shipApprovedRoadmapItems(ctx.projectId, ctx.userId, {
    scoreThreshold: config.scoreThreshold as number | undefined,
    force: config.force === true,
  });

  return { shipped: result.shipped, skipped: result.skipped };
}
