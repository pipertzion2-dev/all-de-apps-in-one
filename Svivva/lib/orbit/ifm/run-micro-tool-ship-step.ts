import { shipIfmMicroToolsForProject } from "./ship-ifm-micro-tools";
import type { RouteRunContext } from "../routes/route-types";

export async function runMicroToolShipStep(
  ctx: RouteRunContext,
  config: Record<string, unknown>,
) {
  if (!ctx.projectId) throw new Error("projectId required for micro_tool_ship step");

  return shipIfmMicroToolsForProject(ctx.projectId, ctx.userId, {
    pairingIds: Array.isArray(config.pairingIds) ? (config.pairingIds as string[]) : undefined,
  });
}
