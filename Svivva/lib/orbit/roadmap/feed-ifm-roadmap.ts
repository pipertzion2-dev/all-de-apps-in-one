import { promoteIfmWinnersToRoadmap } from "./promote-ifm-winner";
import { updateRoadmapItem, parseRoadmapConfig } from "./roadmap-repository";
import { shipIfmMicroToolsForProject } from "../ifm/ship-ifm-micro-tools";
import { getOrbitProjectById } from "../ingest";
import type { PromoteIfmWinnersResult } from "./roadmap-types";

export type FeedIfmRoadmapResult = PromoteIfmWinnersResult & {
  microToolsShipped: number;
};

/** Promote IFM winners to product roadmap and embed micro-tools on bridge pages. */
export async function feedIfmWinnersToRoadmap(
  projectId: string,
  userId: string,
  opts: {
    pairingIds?: string[];
    scoreThreshold?: number;
    requireConversions?: boolean;
    maxPromote?: number;
    shipMicroTools?: boolean;
  } = {},
): Promise<FeedIfmRoadmapResult> {
  const promote = await promoteIfmWinnersToRoadmap(projectId, userId, opts);

  let microToolsShipped = 0;
  if (promote.items.length && opts.shipMicroTools !== false) {
    const ship = await shipIfmMicroToolsForProject(projectId, userId, {
      pairingIds: promote.items.map((i) => i.pairingId),
    });
    microToolsShipped = ship.shipped;

    const project = await getOrbitProjectById(projectId, userId);
    const config = parseRoadmapConfig((project?.metadata || {}) as Record<string, unknown>);
    for (const item of promote.items) {
      const roadmapItem = config.items?.find((i) => i.pairingId === item.pairingId);
      if (roadmapItem) {
        await updateRoadmapItem(projectId, userId, roadmapItem.id, {
          microToolShipped: true,
          status: "approved",
        });
      }
    }
  }

  return { ...promote, microToolsShipped };
}
