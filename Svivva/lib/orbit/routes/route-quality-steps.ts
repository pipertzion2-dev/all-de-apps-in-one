import { getIfmPairingsForProject } from "../ifm/ifm-repository";
import { shipIfmBridgesForProject } from "../ifm/ship-ifm-bridges";
import { buildIfmBridgePageDraft } from "../ifm/bridge-page-generator";
import { bridgeContentHasMicroTool } from "../ifm/micro-tool-generator";
import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type { RouteRunContext } from "./route-types";
import {
  runSeoOpsGate,
  saveSeoOpsSnapshot,
  type SeoOpsGateConfig,
  type SeoOpsGateResult,
} from "./seo-ops-gate";

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

  if (config.requireMicroTools === true && generated.length > 0) {
    let withMicroTool = 0;
    for (const pairing of generated) {
      const draft = buildIfmBridgePageDraft(pairing);
      const [page] = await db
        .select({ content: seoLandingPages.content })
        .from(seoLandingPages)
        .where(eq(seoLandingPages.slug, draft.slug))
        .limit(1);
      if (page && bridgeContentHasMicroTool(page.content)) withMicroTool += 1;
    }
    if (withMicroTool === 0) {
      issues.push("No IFM bridge pages have embedded micro-tool blocks — run micro_tool_ship");
    }
  }

  const strict = config.strict !== false;
  if (issues.length && strict) {
    throw new Error(issues.join("; "));
  }

  return { ok: issues.length === 0, checked: generated.length, issues };
}

export async function runSeoOpsGateStep(
  ctx: RouteRunContext,
  config: Record<string, unknown>,
): Promise<SeoOpsGateResult> {
  if (!ctx.projectId) throw new Error("projectId required for seo_ops_gate step");

  const gateConfig: SeoOpsGateConfig = {
    strict: config.strict !== false,
    maxCanonicalConflicts: Number(config.maxCanonicalConflicts ?? 0),
    maxRobotsConflicts: Number(config.maxRobotsConflicts ?? 0),
    maxMissingCanonical: Number(config.maxMissingCanonical ?? 0),
    maxDuplicateTitles: Number(config.maxDuplicateTitles ?? 0),
    maxThinPages: Number(config.maxThinPages ?? 5),
    minIndexHealthScore: Number(config.minIndexHealthScore ?? 70),
    indexHealthSample: Number(config.indexHealthSample ?? 30),
    requireRobotsSitemap: config.requireRobotsSitemap !== false,
  };

  const result = await runSeoOpsGate(gateConfig);
  await saveSeoOpsSnapshot(ctx.projectId, ctx.userId, result);

  if (!result.ok && gateConfig.strict !== false) {
    throw new Error(result.issues.join("; "));
  }

  return result;
}
