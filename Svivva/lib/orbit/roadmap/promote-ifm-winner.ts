import { emitOrbitEvent } from "../analytics/event-repository";
import { getIfmPairingsForProject } from "../ifm/ifm-repository";
import { DEFAULT_IFM_WINNER_THRESHOLD } from "../ifm/ifm-performance";
import { getOrbitProjectById } from "../ingest";
import { appendRoadmapItems, parseRoadmapConfig } from "./roadmap-repository";
import type { OrbitRoadmapItem, PromoteIfmWinnersResult } from "./roadmap-types";
import type { IfmPairing } from "../ifm/ifm-types";

export const DEFAULT_ROADMAP_PROMOTE_THRESHOLD = DEFAULT_IFM_WINNER_THRESHOLD;

export function isIfmRoadmapCandidate(
  pairing: IfmPairing,
  threshold: number,
  requireConversions = false,
): boolean {
  if (pairing.status === "archived" || pairing.status === "planned") return false;
  const score = pairing.score?.total ?? 0;
  if (score < threshold && pairing.status !== "winner") return false;
  if (requireConversions && !(pairing.score?.conversions7d && pairing.score.conversions7d > 0)) {
    return false;
  }
  return pairing.status === "winner" || pairing.status === "indexed" || score >= threshold;
}

export function ifmPairingToRoadmapItem(pairing: IfmPairing): OrbitRoadmapItem {
  return {
    id: crypto.randomUUID(),
    pairingId: pairing.id,
    fusionTitle: pairing.fusionTitle,
    slug: pairing.slug,
    toolAPath: pairing.toolA.path,
    toolBPath: pairing.toolB.path,
    toolAName: pairing.toolA.name,
    toolBName: pairing.toolB.name,
    score: pairing.score?.total ?? 0,
    sessions7d: pairing.score?.sessions7d,
    conversions7d: pairing.score?.conversions7d,
    status: "proposed",
    promotedAt: new Date().toISOString(),
    microToolShipped: false,
  };
}

export async function promoteIfmWinnersToRoadmap(
  projectId: string,
  userId: string,
  opts: {
    pairingIds?: string[];
    scoreThreshold?: number;
    requireConversions?: boolean;
    maxPromote?: number;
  } = {},
): Promise<PromoteIfmWinnersResult> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const meta = (project.metadata || {}) as Record<string, unknown>;
  const roadmapConfig = parseRoadmapConfig(meta);
  const threshold =
    opts.scoreThreshold ??
    roadmapConfig.promoteScoreThreshold ??
    DEFAULT_ROADMAP_PROMOTE_THRESHOLD;
  const maxPromote = Math.min(Math.max(opts.maxPromote ?? 3, 1), 10);

  const pairings = await getIfmPairingsForProject(projectId, userId);
  const existingPairingIds = new Set((roadmapConfig.items ?? []).map((i) => i.pairingId));

  let candidates = pairings.filter(
    (p) =>
      !existingPairingIds.has(p.id) &&
      isIfmRoadmapCandidate(p, threshold, opts.requireConversions),
  );

  if (opts.pairingIds?.length) {
    const ids = new Set(opts.pairingIds);
    candidates = candidates.filter((p) => ids.has(p.id));
  }

  candidates = candidates
    .sort((a, b) => (b.score?.total ?? 0) - (a.score?.total ?? 0))
    .slice(0, maxPromote);

  if (!candidates.length) {
    return { promoted: 0, skipped: pairings.length, items: [] };
  }

  const items = candidates.map(ifmPairingToRoadmapItem);
  await appendRoadmapItems(projectId, userId, items);

  for (const item of items) {
    await emitOrbitEvent({
      orbitProjectId: projectId,
      eventType: "ifm_roadmap_promoted",
      source: "internal",
      idempotencyKey: `roadmap:${projectId}:${item.pairingId}`,
      dimensions: {
        pairingId: item.pairingId,
        fusionTitle: item.fusionTitle,
        score: item.score,
      },
      metadata: { roadmapItemId: item.id },
    });
  }

  return {
    promoted: items.length,
    skipped: pairings.length - items.length,
    items,
  };
}
