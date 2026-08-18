import { listIndexRecordsForProject } from "../indexing/index-repository";
import { listEventsForProject } from "../analytics/event-repository";
import { parseExternalAnalyticsConfig } from "../analytics/external-signals";
import { getOrbitProjectById } from "../ingest";
import { buildIfmBridgePageDraft } from "./bridge-page-generator";
import {
  getIfmPairingsForProject,
  parseIfmConfig,
  replaceIfmPairings,
  updateIfmProjectConfig,
} from "./ifm-repository";
import { generateIfmPairings, pairKey } from "./intent-fusion-matrix";
import { NATIVE_SVIVVA_TOOLS } from "../mini-app-curation";
import { emitOrbitEvent } from "../analytics/event-repository";
import type { IfmPairing, IfmPairingScore, IfmPerformanceSummary, IfmProjectConfig } from "./ifm-types";
import type { OrbitIndexRecord } from "../schema";
import type { OrbitEvent } from "../schema";

export const DEFAULT_IFM_WINNER_THRESHOLD = 55;
export const DEFAULT_IFM_PRUNE_THRESHOLD = 20;
export const IFM_MIN_AGE_FOR_PRUNE_MS = 14 * 24 * 60 * 60 * 1000;

const INDEX_STATUS_SCORE: Record<string, number> = {
  indexed: 40,
  submitted: 15,
  failed: 5,
  not_indexed: 0,
  created: 0,
};

export function pairingIndexSlug(pairing: IfmPairing): string {
  return buildIfmBridgePageDraft(pairing).slug;
}

export function indexRecordMatchesPairing(
  record: OrbitIndexRecord,
  pairing: IfmPairing,
): boolean {
  const slug = pairingIndexSlug(pairing);
  const url = record.url.toLowerCase();
  const pairingSlug = pairing.slug.toLowerCase();
  return (
    url.includes(slug.toLowerCase()) ||
    url.includes(pairingSlug) ||
    url.includes(pairingSlug.replace(/^ifm-/, "ifm/"))
  );
}

export function findIndexForPairing(
  records: OrbitIndexRecord[],
  pairing: IfmPairing,
): OrbitIndexRecord | undefined {
  return records.find((r) => indexRecordMatchesPairing(r, pairing));
}

export function scoreIfmPairing(input: {
  pairing: IfmPairing;
  indexRecord?: OrbitIndexRecord;
  events: OrbitEvent[];
  analyticsBoost?: number;
  now?: Date;
}): IfmPairingScore {
  const now = input.now ?? new Date();
  const indexStatus = input.indexRecord?.status ?? "none";
  const indexBoost = INDEX_STATUS_SCORE[indexStatus] ?? 0;

  let eventBoost = 0;
  for (const ev of input.events) {
    if (ev.eventType === "ifm_bridge_shipped") {
      const meta = (ev.metadata || {}) as Record<string, unknown>;
      if (meta.pairingId === input.pairing.id) eventBoost += 15;
    }
    if (ev.eventType === "ifm_pair_generated") {
      const dims = (ev.dimensions || {}) as Record<string, unknown>;
      if (dims.fusionTitle === input.pairing.fusionTitle) eventBoost += 5;
    }
  }

  const analyticsBoost = input.analyticsBoost ?? 0;
  const total = Math.min(100, indexBoost + eventBoost + analyticsBoost);

  return {
    total,
    indexBoost,
    eventBoost,
    analyticsBoost,
    indexStatus: indexStatus === "none" ? undefined : indexStatus,
    scoredAt: now.toISOString(),
  };
}

export function derivePairingStatusAfterScore(
  pairing: IfmPairing,
  score: IfmPairingScore,
  winnerThreshold: number,
): IfmPairing["status"] {
  if (pairing.status === "archived") return "archived";
  if (score.total >= winnerThreshold) return "winner";
  if (score.indexStatus === "indexed") return "indexed";
  if (pairing.status === "generated") return "generated";
  return pairing.status;
}

export function isIfmPruneCandidate(
  pairing: IfmPairing,
  score: IfmPairingScore,
  pruneThreshold: number,
  now = new Date(),
): boolean {
  if (pairing.status === "archived" || pairing.status === "planned") return false;
  if (pairing.status === "winner") return false;
  const ageMs = now.getTime() - new Date(pairing.createdAt).getTime();
  if (ageMs < IFM_MIN_AGE_FOR_PRUNE_MS) return false;
  return score.total < pruneThreshold;
}

export function buildIfmLeaderboard(pairings: IfmPairing[]): IfmPairing[] {
  return [...pairings]
    .filter((p) => p.status !== "archived")
    .sort((a, b) => (b.score?.total ?? 0) - (a.score?.total ?? 0));
}

export function resolveIfmThresholds(config: IfmProjectConfig): {
  winnerThreshold: number;
  pruneThreshold: number;
} {
  return {
    winnerThreshold: config.winnerThreshold ?? DEFAULT_IFM_WINNER_THRESHOLD,
    pruneThreshold: config.pruneThreshold ?? DEFAULT_IFM_PRUNE_THRESHOLD,
  };
}

function projectAnalyticsBoost(
  config: ReturnType<typeof parseExternalAnalyticsConfig>,
  hasIndexedPairing: boolean,
): number {
  if (!hasIndexedPairing) return 0;
  let boost = 0;
  if (config.sessions7d != null && config.sessions7d >= 50) boost += 5;
  if (config.conversions7d != null && config.conversions7d > 0) boost += 10;
  return boost;
}

export async function rescoreIfmPairingsForProject(
  projectId: string,
  userId: string,
  opts: { autoPrune?: boolean } = {},
): Promise<IfmPerformanceSummary> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const meta = (project.metadata || {}) as Record<string, unknown>;
  const ifmConfig = parseIfmConfig(meta);
  const { winnerThreshold, pruneThreshold } = resolveIfmThresholds(ifmConfig);

  const pairings = await getIfmPairingsForProject(projectId, userId);
  const indexRecords = await listIndexRecordsForProject(projectId);
  const events = await listEventsForProject(projectId, { limit: 500 });
  const external = parseExternalAnalyticsConfig(meta);

  const hasIndexed = pairings.some((p) => {
    const rec = findIndexForPairing(indexRecords, p);
    return rec?.status === "indexed";
  });
  const analyticsBoost = projectAnalyticsBoost(external, hasIndexed);

  const now = new Date();
  let archived = 0;
  const updated: IfmPairing[] = [];

  for (const pairing of pairings) {
    const indexRecord = findIndexForPairing(indexRecords, pairing);
    const score = scoreIfmPairing({
      pairing,
      indexRecord,
      events,
      analyticsBoost: indexRecord?.status === "indexed" ? analyticsBoost : 0,
      now,
    });

    let status = derivePairingStatusAfterScore(pairing, score, winnerThreshold);

    if (
      (opts.autoPrune ?? ifmConfig.autoPrune) &&
      isIfmPruneCandidate({ ...pairing, status }, score, pruneThreshold, now)
    ) {
      status = "archived";
      archived += 1;
      await emitOrbitEvent({
        orbitProjectId: projectId,
        eventType: "ifm_pair_pruned",
        source: "internal",
        idempotencyKey: `ifm:prune:${projectId}:${pairing.id}:${now.toISOString().slice(0, 10)}`,
        dimensions: { pairingId: pairing.id, slug: pairing.slug, score: score.total },
      });
    }

    updated.push({ ...pairing, score, status });

    await emitOrbitEvent({
      orbitProjectId: projectId,
      eventType: "ifm_pair_scored",
      source: "internal",
      idempotencyKey: `ifm:score:${projectId}:${pairing.id}:${now.toISOString().slice(0, 10)}`,
      dimensions: { pairingId: pairing.id, total: score.total, status },
    });
  }

  await replaceIfmPairings(projectId, userId, updated);
  await updateIfmProjectConfig(projectId, userId, { lastScoredAt: now.toISOString() });

  const winners = updated.filter((p) => p.status === "winner");
  const pruneCandidates = updated.filter(
    (p) =>
      p.status !== "archived" &&
      p.score &&
      isIfmPruneCandidate(p, p.score, pruneThreshold, now),
  );

  return {
    scored: updated.length,
    winners,
    pruneCandidates,
    archived,
    leaderboard: buildIfmLeaderboard(updated),
  };
}

export async function expandIfmPairFromWinner(
  projectId: string,
  userId: string,
  pairingId: string,
): Promise<{ created: number; pairings: IfmPairing[] }> {
  const pairings = await getIfmPairingsForProject(projectId, userId);
  const winner = pairings.find((p) => p.id === pairingId);
  if (!winner) throw new Error("IFM pairing not found");

  const excludePairKeys = pairings.map((p) =>
    [p.toolA.path, p.toolB.path].sort().join("|"),
  );

  const hubA = winner.toolA.hub;
  const hubB = winner.toolB.hub;
  const candidates = generateIfmPairings({ count: 8, excludePairKeys });
  const sameHub = candidates.filter((p) => {
    const hubs = [p.toolA.hub, p.toolB.hub].sort().join("|");
    const target = [hubA, hubB].sort().join("|");
    return hubs === target;
  });

  const toAdd = sameHub.slice(0, 2);
  if (!toAdd.length) {
    return { created: 0, pairings: [] };
  }

  const { appendIfmPairings, persistIfmPairingEntities } = await import("./ifm-repository");
  await appendIfmPairings(projectId, userId, toAdd);
  for (const pairing of toAdd) {
    await persistIfmPairingEntities(projectId, pairing);
    await emitOrbitEvent({
      orbitProjectId: projectId,
      eventType: "ifm_pair_generated",
      source: "internal",
      idempotencyKey: `ifm:expand:${projectId}:${pairing.id}`,
      dimensions: {
        fusionTitle: pairing.fusionTitle,
        toolA: pairing.toolA.path,
        toolB: pairing.toolB.path,
        expandedFrom: pairingId,
      },
    });
  }

  return { created: toAdd.length, pairings: toAdd };
}

export async function pruneIfmPairing(
  projectId: string,
  userId: string,
  pairingId: string,
): Promise<{ ok: boolean; pairingId: string }> {
  const pairings = await getIfmPairingsForProject(projectId, userId);
  const target = pairings.find((p) => p.id === pairingId);
  if (!target) throw new Error("IFM pairing not found");

  const merged = pairings.map((p) =>
    p.id === pairingId ? { ...p, status: "archived" as const } : p,
  );
  await replaceIfmPairings(projectId, userId, merged);

  await emitOrbitEvent({
    orbitProjectId: projectId,
    eventType: "ifm_pair_pruned",
    source: "internal",
    idempotencyKey: `ifm:prune:manual:${projectId}:${pairingId}`,
    dimensions: { pairingId, slug: target.slug },
  });

  return { ok: true, pairingId };
}

/** Validate pair key helper for tests */
export function pairingKeyFromIfmPairing(pairing: IfmPairing): string {
  const a = NATIVE_SVIVVA_TOOLS.find((t) => t.path === pairing.toolA.path);
  const b = NATIVE_SVIVVA_TOOLS.find((t) => t.path === pairing.toolB.path);
  if (a && b) return pairKey(a, b);
  return [pairing.toolA.path, pairing.toolB.path].sort().join("|");
}
