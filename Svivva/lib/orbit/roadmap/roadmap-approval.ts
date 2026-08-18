import { emitOrbitEvent } from "../analytics/event-repository";
import { getIfmPairingsForProject, parseIfmConfig } from "../ifm/ifm-repository";
import { getOrbitProjectById } from "../ingest";
import { buildFusionProductSpec } from "./fusion-product-spec";
import { parseRoadmapConfig, updateRoadmapItem, touchRoadmapConfig } from "./roadmap-repository";
import { isRoadmapApprovalCandidate } from "./roadmap-performance";
import type { OrbitRoadmapItem } from "./roadmap-types";

export const DEFAULT_ROADMAP_APPROVE_THRESHOLD = 55;

export type ApproveRoadmapResult = {
  approved: number;
  skipped: number;
  items: OrbitRoadmapItem[];
};

export async function approveRoadmapItems(
  projectId: string,
  userId: string,
  opts: {
    itemIds?: string[];
    scoreThreshold?: number;
    force?: boolean;
  } = {},
): Promise<ApproveRoadmapResult> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const meta = project.metadata as Record<string, unknown>;
  const config = parseRoadmapConfig(meta);
  const ifmConfig = parseIfmConfig(meta);
  const pairings = ifmConfig.pairings ?? (await getIfmPairingsForProject(projectId, userId));
  const pairingById = new Map(pairings.map((p) => [p.id, p]));

  const threshold =
    opts.scoreThreshold ?? config.approveScoreThreshold ?? DEFAULT_ROADMAP_APPROVE_THRESHOLD;

  let candidates = (config.items ?? []).filter(
    (i) => i.status === "proposed" && i.microToolShipped,
  );

  if (opts.itemIds?.length) {
    const ids = new Set(opts.itemIds);
    candidates = candidates.filter((i) => ids.has(i.id));
  }

  if (!opts.force) {
    candidates = candidates.filter((i) => isRoadmapApprovalCandidate(i, threshold));
  }

  const approved: OrbitRoadmapItem[] = [];
  const now = new Date().toISOString();

  for (const item of candidates) {
    const pairing = pairingById.get(item.pairingId);
    const productSpec = buildFusionProductSpec(item, pairing);
    const next = await updateRoadmapItem(projectId, userId, item.id, {
      status: "approved",
      approvedAt: now,
      productSpec,
    });
    if (!next) continue;
    approved.push(next);

    await emitOrbitEvent({
      orbitProjectId: projectId,
      eventType: "ifm_roadmap_approved",
      source: "internal",
      idempotencyKey: `roadmap-approve:${projectId}:${item.id}`,
      dimensions: {
        roadmapItemId: item.id,
        pairingId: item.pairingId,
        fusionTitle: item.fusionTitle,
        score: next.rescoreTotal ?? next.score,
      },
    });
  }

  if (approved.length) {
    await touchRoadmapConfig(projectId, userId, { lastApprovedAt: now });
  }

  return {
    approved: approved.length,
    skipped: (config.items ?? []).length - approved.length,
    items: approved,
  };
}
