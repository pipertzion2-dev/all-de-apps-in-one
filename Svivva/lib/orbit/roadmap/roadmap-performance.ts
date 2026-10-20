import { listEventsForProject } from "../analytics/event-repository";
import { listIndexRecordsForProject } from "../indexing/index-repository";
import { getIfmPairingsForProject, parseIfmConfig } from "../ifm/ifm-repository";
import {
  findIndexForPairing,
  scoreIfmPairing,
} from "../ifm/ifm-performance";
import { getOrbitProjectById } from "../ingest";
import { parseRoadmapConfig, updateRoadmapItem } from "./roadmap-repository";
import type { OrbitRoadmapItem } from "./roadmap-types";

export type RescoreRoadmapResult = {
  rescored: number;
  items: OrbitRoadmapItem[];
};

export async function rescoreRoadmapItems(
  projectId: string,
  userId: string,
  opts: { itemIds?: string[] } = {},
): Promise<RescoreRoadmapResult> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const config = parseRoadmapConfig(project.metadata as Record<string, unknown>);
  const ifmConfig = parseIfmConfig(project.metadata as Record<string, unknown>);
  const pairings = ifmConfig.pairings ?? (await getIfmPairingsForProject(projectId, userId));
  const pairingById = new Map(pairings.map((p) => [p.id, p]));

  const [indexRecords, events] = await Promise.all([
    listIndexRecordsForProject(projectId),
    listEventsForProject(projectId, { limit: 200 }),
  ]);

  let items = (config.items ?? []).filter((i) => i.status !== "archived");
  if (opts.itemIds?.length) {
    const ids = new Set(opts.itemIds);
    items = items.filter((i) => ids.has(i.id));
  }

  const updated: OrbitRoadmapItem[] = [];

  for (const item of items) {
    const pairing = pairingById.get(item.pairingId);
    if (!pairing) continue;

    const indexRecord = findIndexForPairing(indexRecords, pairing);
    const score = scoreIfmPairing({
      pairing,
      indexRecord,
      events,
      pairAnalytics: {
        sessions7d: item.sessions7d ?? pairing.score?.sessions7d ?? 0,
        conversions7d: item.conversions7d ?? pairing.score?.conversions7d ?? 0,
      },
    });

    const next = await updateRoadmapItem(projectId, userId, item.id, {
      score: score.total,
      sessions7d: score.sessions7d,
      conversions7d: score.conversions7d,
      rescoreTotal: score.total,
    });
    if (next) updated.push(next);
  }

  return { rescored: updated.length, items: updated };
}

export function isRoadmapApprovalCandidate(
  item: OrbitRoadmapItem,
  threshold: number,
): boolean {
  if (item.status !== "proposed") return false;
  if (!item.microToolShipped) return false;
  return (item.rescoreTotal ?? item.score) >= threshold;
}

export function isRoadmapShipCandidate(
  item: OrbitRoadmapItem,
  threshold: number,
): boolean {
  if (item.status !== "approved") return false;
  if (!item.productSpec) return false;
  const sessions = item.sessions7d ?? 0;
  const conversions = item.conversions7d ?? 0;
  const score = item.rescoreTotal ?? item.score;
  if (score < threshold) return false;
  return conversions > 0 || sessions >= 10;
}
