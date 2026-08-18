import { getIfmPairingsForProject } from "../ifm/ifm-repository";
import { shipIfmBridgesForProject } from "../ifm/ship-ifm-bridges";
import type { RouteRunContext } from "./route-types";

export async function runBridgeShipStep(
  ctx: RouteRunContext,
  config: Record<string, unknown>,
): Promise<{ shipped: number; failed: number }> {
  if (!ctx.projectId) throw new Error("projectId required for bridge_ship step");

  const summary = await shipIfmBridgesForProject(ctx.projectId, ctx.userId, {
    statusFilter: (config.statusFilter as ("planned" | "generated")[]) ?? ["planned"],
  });

  if (summary.failed > 0 && config.allowPartial !== true) {
    throw new Error(`${summary.failed} bridge page(s) failed quality gate`);
  }

  return { shipped: summary.shipped, failed: summary.failed };
}

export async function runQualityGateStep(
  ctx: RouteRunContext,
  config: Record<string, unknown>,
): Promise<{ ok: boolean; checked: number; issues: string[] }> {
  if (!ctx.projectId) throw new Error("projectId required for quality_gate step");

  const pairings = await getIfmPairingsForProject(ctx.projectId, ctx.userId);
  const generated = pairings.filter((p) => p.status === "generated" || p.status === "indexed");
  const issues: string[] = [];

  if (config.requireIfmBridges !== false && pairings.length > 0 && generated.length === 0) {
    issues.push("No shipped IFM bridge pages — run bridge_ship first");
  }

  const minShipped = Number(config.minShippedBridges) || 0;
  if (generated.length < minShipped) {
    issues.push(`Expected at least ${minShipped} shipped bridges, found ${generated.length}`);
  }

  const strict = config.strict !== false;
  if (issues.length && strict) {
    throw new Error(issues.join("; "));
  }

  return { ok: issues.length === 0, checked: generated.length, issues };
}
