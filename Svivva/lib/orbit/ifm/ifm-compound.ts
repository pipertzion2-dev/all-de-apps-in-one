import { emitOrbitEvent } from "../analytics/event-repository";
import { pullGa4IfmPageMetricsForProject } from "../analytics/ga4-data-api";
import { getOrbitProjectById } from "../ingest";
import { parseIfmConfig, updateIfmProjectConfig } from "./ifm-repository";
import { shipIfmBridgesForProject } from "./ship-ifm-bridges";
import { buildPairAnalyticsMap } from "./ifm-analytics";
import {
  expandIfmPairFromWinner,
  rescoreIfmPairingsForProject,
} from "./ifm-performance";
import type { IfmCompoundSummary } from "./ifm-types";

export type CompoundIfmWinnersInput = {
  expandCount?: number;
  shipExpanded?: boolean;
  autoPrune?: boolean;
  syncGa4?: boolean;
};

/** Rescore with per-pair GA4, expand top winners, and ship new bridge pages. */
export async function compoundIfmWinnersForProject(
  projectId: string,
  userId: string,
  opts: CompoundIfmWinnersInput = {},
): Promise<IfmCompoundSummary> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const ifmConfig = parseIfmConfig(project.metadata as Record<string, unknown>);
  const expandCount = Math.min(Math.max(opts.expandCount ?? 2, 1), 5);
  const shipExpanded = opts.shipExpanded !== false;

  let ga4Pages: Awaited<ReturnType<typeof pullGa4IfmPageMetricsForProject>>["pages"];
  if (opts.syncGa4 !== false) {
    const ga4 = await pullGa4IfmPageMetricsForProject(projectId, userId);
    if (ga4.ok && ga4.pages?.length) {
      ga4Pages = ga4.pages;
    }
  }

  const perf = await rescoreIfmPairingsForProject(projectId, userId, {
    autoPrune: opts.autoPrune ?? ifmConfig.autoPrune,
    pairAnalyticsPages: ga4Pages,
  });

  const winners = perf.winners.slice(0, expandCount);
  let expanded = 0;
  let shipped = 0;
  const expandedPairingIds: string[] = [];

  for (const winner of winners) {
    const { created, pairings } = await expandIfmPairFromWinner(
      projectId,
      userId,
      winner.id,
    );
    expanded += created;

    if (created > 0 && shipExpanded) {
      const ship = await shipIfmBridgesForProject(projectId, userId, {
        pairingIds: pairings.map((p) => p.id),
        statusFilter: ["planned"],
      });
      shipped += ship.shipped;
      expandedPairingIds.push(...pairings.map((p) => p.id));
    }

    if (created > 0) {
      await emitOrbitEvent({
        orbitProjectId: projectId,
        eventType: "ifm_winner_compounded",
        source: "internal",
        idempotencyKey: `ifm:compound:${projectId}:${winner.id}:${new Date().toISOString().slice(0, 10)}`,
        dimensions: {
          winnerId: winner.id,
          winnerScore: winner.score?.total ?? 0,
          expanded: created,
          shipped,
        },
        metadata: { expandedPairingIds: pairings.map((p) => p.id) },
      });
    }
  }

  await updateIfmProjectConfig(projectId, userId, {
    lastCompoundedAt: new Date().toISOString(),
  });

  return {
    ...perf,
    expanded,
    shipped,
    expandedPairingIds,
  };
}
