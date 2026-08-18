import { getOrbitProjectById } from "@/lib/orbit/ingest";
import { listOrbitCampaignsForProject } from "@/lib/orbit/campaign/campaign-repository";
import { listContentAssetsByCampaign } from "@/lib/orbit/content/content-repository";
import { listIndexRecordsForProject } from "../indexing/index-repository";
import { listEventsForProject } from "./event-repository";
import {
  createRecommendation,
  findOpenRecommendationByKind,
  listOpenRecommendations,
} from "./recommendation-repository";
import type { RecommendationDraft } from "./event-types";
import { parseIfmConfig } from "../ifm/ifm-repository";
import { parseRoadmapConfig } from "../roadmap/roadmap-repository";
import { isIfmRoadmapCandidate } from "../roadmap/promote-ifm-winner";
import {
  scoreIfmPairing,
  findIndexForPairing,
  isIfmPruneCandidate,
  resolveIfmThresholds,
  buildIfmLeaderboard,
} from "../ifm/ifm-performance";
import type { OrbitRecommendation } from "../schema";

const MS_DAY = 24 * 60 * 60 * 1000;

export function isIndexRecordStuckSubmitted(
  submittedAt: Date | string | null | undefined,
  now = new Date(),
): boolean {
  if (!submittedAt) return false;
  const t = new Date(submittedAt).getTime();
  return now.getTime() - t > 3 * MS_DAY;
}

export type GenerateRecommendationsResult = {
  created: number;
  skipped: number;
  recommendations: Array<{ id: string; kind: string; title: string }>;
};

async function upsertRecommendation(
  projectId: string,
  draft: RecommendationDraft,
): Promise<boolean> {
  const existing = await findOpenRecommendationByKind(
    projectId,
    draft.kind,
    draft.orbitCampaignId,
  );
  if (existing) return false;
  const row = await createRecommendation(projectId, draft);
  return Boolean(row.id);
}

async function upsertIfmPairingRecommendation(
  projectId: string,
  draft: RecommendationDraft,
  openRecs: OrbitRecommendation[],
): Promise<boolean> {
  const pairingId = (draft.actionPayload as Record<string, unknown>)?.pairingId;
  const dup = openRecs.find(
    (r) =>
      r.kind === draft.kind &&
      (r.actionPayload as Record<string, unknown>)?.pairingId === pairingId,
  );
  if (dup) return false;
  const row = await createRecommendation(projectId, draft);
  return Boolean(row.id);
}

export async function generateRecommendationsForProject(
  projectId: string,
  userId: string,
): Promise<GenerateRecommendationsResult> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const result: GenerateRecommendationsResult = {
    created: 0,
    skipped: 0,
    recommendations: [],
  };

  const indexRecords = await listIndexRecordsForProject(projectId);

  for (const record of indexRecords) {
    if (record.status === "submitted" && isIndexRecordStuckSubmitted(record.submittedAt)) {
      const created = await upsertRecommendation(projectId, {
        kind: "index_recheck",
        priority: "high",
        title: `Recheck indexing for ${record.url}`,
        rationale: `URL has been in submitted state for 3+ days without progressing to indexed.`,
        actionPayload: { indexRecordId: record.id, url: record.url },
      });
      if (created) result.created += 1;
      else result.skipped += 1;
    }

    if (record.status === "failed" || record.status === "not_indexed") {
      const created = await upsertRecommendation(projectId, {
        kind: "index_recheck",
        priority: "medium",
        title: `Retry indexing for ${record.url}`,
        rationale: `Index record is ${record.status}. Run recheck or resubmit.`,
        actionPayload: { indexRecordId: record.id, url: record.url },
      });
      if (created) result.created += 1;
      else result.skipped += 1;
    }
  }

  const events = await listEventsForProject(projectId, { limit: 500 });
  const recentFailures = events.filter((e) => e.eventType === "distribution_failed");
  for (const ev of recentFailures.slice(0, 5)) {
    const created = await upsertRecommendation(projectId, {
      kind: "retry_distribution",
      priority: "high",
      title: "Retry failed distribution",
      rationale: "A recent distribution job failed. Retry after reviewing credentials or copy.",
      orbitCampaignId: ev.orbitCampaignId ?? undefined,
      triggerEventId: ev.id,
      actionPayload: {
        contentAssetId: ev.contentAssetId,
        distributionJobId: ev.distributionJobId,
      },
    });
    if (created) result.created += 1;
    else result.skipped += 1;
  }

  const manualReady = events.filter((e) => e.eventType === "distribution_manual_ready");
  for (const ev of manualReady.slice(0, 3)) {
    const created = await upsertRecommendation(projectId, {
      kind: "manual_publish_review",
      priority: "medium",
      title: "Review manual-ready publish copy",
      rationale: "Asset is ready for manual publish on an external platform.",
      orbitCampaignId: ev.orbitCampaignId ?? undefined,
      triggerEventId: ev.id,
      actionPayload: { contentAssetId: ev.contentAssetId },
    });
    if (created) result.created += 1;
    else result.skipped += 1;
  }

  const campaigns = await listOrbitCampaignsForProject(projectId, userId);
  for (const campaign of campaigns) {
    const assets = await listContentAssetsByCampaign(campaign.id);
    const failedValidation = assets.filter((a) => a.validationStatus === "failed");
    if (failedValidation.length > 0) {
      const created = await upsertRecommendation(projectId, {
        kind: "regenerate_content",
        priority: "high",
        title: `Regenerate ${failedValidation.length} failed asset(s)`,
        rationale: "Content failed policy validation. Edit policy or regenerate assets.",
        orbitCampaignId: campaign.id,
        actionPayload: {
          assetIds: failedValidation.map((a) => a.id),
        },
      });
      if (created) result.created += 1;
      else result.skipped += 1;
    }

    const hasDistributionSuccess = events.some(
      (e) =>
        e.orbitCampaignId === campaign.id && e.eventType === "distribution_succeeded",
    );
    const hasIndexed = indexRecords.some((r) => r.status === "indexed");
    const approvedAssets = assets.filter((a) => a.approvalStatus === "approved");

    if (approvedAssets.length > 0 && !hasDistributionSuccess && campaign.status === "active") {
      const created = await upsertRecommendation(projectId, {
        kind: "run_distribution",
        priority: "medium",
        title: `Run distribution for ${campaign.name}`,
        rationale: "Campaign has approved assets but no successful distribution yet.",
        orbitCampaignId: campaign.id,
        actionPayload: { campaignId: campaign.id },
      });
      if (created) result.created += 1;
      else result.skipped += 1;
    }

    if (hasIndexed && approvedAssets.length === 0 && campaign.status === "active") {
      const created = await upsertRecommendation(projectId, {
        kind: "expand_content",
        priority: "low",
        title: "Add social assets after indexing",
        rationale: "Pages are indexed but no approved social/content assets to amplify yet.",
        orbitCampaignId: campaign.id,
        actionPayload: { campaignId: campaign.id },
      });
      if (created) result.created += 1;
      else result.skipped += 1;
    }

    const campaignFailures = events.filter(
      (e) => e.orbitCampaignId === campaign.id && e.eventType === "distribution_failed",
    );
    const campaignSuccesses = events.filter(
      (e) => e.orbitCampaignId === campaign.id && e.eventType === "distribution_succeeded",
    );
    if (
      campaign.status === "active" &&
      campaignFailures.length >= 3 &&
      campaignSuccesses.length === 0
    ) {
      const created = await upsertRecommendation(projectId, {
        kind: "replan_campaign",
        priority: "high",
        title: `Replan ${campaign.name} after repeated failures`,
        rationale:
          "Multiple distribution failures with no successes. Generate a fresh campaign plan.",
        orbitCampaignId: campaign.id,
        actionPayload: { campaignId: campaign.id, objective: campaign.objective },
      });
      if (created) result.created += 1;
      else result.skipped += 1;
    }
  }

  const trafficDrop = events.filter((e) => e.eventType === "external_traffic_drop");
  if (trafficDrop.length > 0) {
    const created = await upsertRecommendation(projectId, {
      kind: "replan_campaign",
      priority: "high",
      title: "Replan after traffic drop",
      rationale: "External analytics detected a significant session decline. Revisit campaign strategy.",
      triggerEventId: trafficDrop[0].id,
      actionPayload: {},
    });
    if (created) result.created += 1;
    else result.skipped += 1;
  }

  const hasIndexedPages = indexRecords.some((r) => r.status === "indexed");
  const lowConversion =
    events.some((e) => e.eventType === "external_page_view") &&
    !events.some((e) => e.eventType === "external_conversion");
  if (hasIndexedPages && lowConversion) {
    const created = await upsertRecommendation(projectId, {
      kind: "expand_content",
      priority: "medium",
      title: "Expand content after indexed pages with low conversions",
      rationale: "Pages are indexed but external conversion signals are weak. Add conversion-focused assets.",
      actionPayload: {},
    });
    if (created) result.created += 1;
    else result.skipped += 1;
  }

  const ifmConfig = parseIfmConfig(project.metadata as Record<string, unknown>);
  if (ifmConfig.enabled && (ifmConfig.pairings?.length ?? 0) > 0) {
    const { winnerThreshold, pruneThreshold } = resolveIfmThresholds(ifmConfig);
    const pairings = ifmConfig.pairings ?? [];
    const openRecs = await listOpenRecommendations(projectId);

    const scored = pairings.map((pairing) => {
      const indexRecord = findIndexForPairing(indexRecords, pairing);
      const score = scoreIfmPairing({ pairing, indexRecord, events });
      return { pairing, score };
    });

    const winners = buildIfmLeaderboard(
      scored.map(({ pairing, score }) => ({ ...pairing, score })),
    ).filter((p) => (p.score?.total ?? 0) >= winnerThreshold && p.status !== "archived");

    for (const winner of winners.slice(0, 2)) {
      const created = await upsertIfmPairingRecommendation(
        projectId,
        {
          kind: "expand_ifm_pair",
          priority: "medium",
          title: `Expand winning IFM pair: ${winner.fusionTitle}`,
          rationale: `Pairing scored ${winner.score?.total ?? 0}/100. Generate adjacent hub variants to compound intent fusion.`,
          actionPayload: {
            pairingId: winner.id,
            score: winner.score?.total,
            slug: winner.slug,
          },
        },
        openRecs,
      );
      if (created) result.created += 1;
      else result.skipped += 1;
    }

    const roadmapConfig = parseRoadmapConfig(project.metadata as Record<string, unknown>);
    const promotedIds = new Set((roadmapConfig.items ?? []).map((i) => i.pairingId));
    for (const winner of winners.filter((w) => w.status === "winner").slice(0, 2)) {
      if (promotedIds.has(winner.id)) continue;
      if (!isIfmRoadmapCandidate(winner, winnerThreshold, false)) continue;
      const hasTraction =
        (winner.score?.conversions7d ?? 0) > 0 || (winner.score?.sessions7d ?? 0) >= 10;
      if (!hasTraction) continue;

      const created = await upsertIfmPairingRecommendation(
        projectId,
        {
          kind: "promote_to_roadmap",
          priority: "medium",
          title: `Promote IFM winner to product roadmap: ${winner.fusionTitle}`,
          rationale: `Winner scored ${winner.score?.total ?? 0}/100 with GA4 traction. Feed into product roadmap and ship micro-tool.`,
          actionPayload: {
            pairingId: winner.id,
            score: winner.score?.total,
            slug: winner.slug,
          },
        },
        openRecs,
      );
      if (created) result.created += 1;
      else result.skipped += 1;
    }

    for (const { pairing, score } of scored) {
      if (!isIfmPruneCandidate(pairing, score, pruneThreshold)) continue;
      const created = await upsertIfmPairingRecommendation(
        projectId,
        {
          kind: "prune_ifm_pair",
          priority: "low",
          title: `Prune underperforming IFM pair: ${pairing.fusionTitle}`,
          rationale: `Score ${score.total}/100 after 14+ days without index traction. Archive to reduce thin-surface risk.`,
          actionPayload: {
            pairingId: pairing.id,
            score: score.total,
            slug: pairing.slug,
          },
        },
        openRecs,
      );
      if (created) result.created += 1;
      else result.skipped += 1;
    }
  }

  const open = await listOpenRecommendations(projectId);
  result.recommendations = open.slice(0, 20).map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
  }));

  return result;
}
