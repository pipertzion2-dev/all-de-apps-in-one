import { compoundIfmWinnersForProject } from "./ifm-compound";
import type { RouteRunContext } from "../routes/route-types";

export async function runIfmCompoundStep(
  ctx: RouteRunContext,
  config: Record<string, unknown>,
) {
  if (!ctx.projectId) {
    throw new Error("projectId required for ifm_compound step");
  }

  return compoundIfmWinnersForProject(ctx.projectId, ctx.userId, {
    expandCount: Number(config.expandCount) || 2,
    shipExpanded: config.shipExpanded !== false,
    autoPrune: config.autoPrune === true,
    syncGa4: config.syncGa4 !== false,
  });
}
