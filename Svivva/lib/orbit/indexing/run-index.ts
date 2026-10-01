import { getOrbitProjectById, getOrbitGraph } from "@/lib/orbit/ingest";
import { getOrbitCampaignById } from "@/lib/orbit/campaign/campaign-repository";
import type { CampaignPlan, PlannedAsset } from "@/lib/orbit/campaign/plan-types";
import { listContentAssetsByCampaign } from "@/lib/orbit/content/content-repository";
import type {
  IndexProvider,
  IndexRunResult,
  RunCampaignIndexInput,
  RunProjectIndexInput,
} from "./index-types";
import { resolveIndexUrls } from "./url-resolver";
import { probeIndexUrl } from "./url-probe";
import { computeNextCheckAt, statusAfterProbe, statusAfterSubmit } from "./index-state-machine";
import {
  listIndexRecordsForProject,
  upsertOrbitIndexRecord,
  updateIndexRecordStatus,
} from "./index-repository";
import { submitToProviders } from "./index-providers";
import type { OrbitIndexStatus } from "../graph-constants";

function parseCampaignPlan(
  snapshot: Record<string, unknown> | null | undefined,
): CampaignPlan | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const plan = snapshot as CampaignPlan;
  if (!Array.isArray(plan.phases)) return null;
  return plan;
}

function indexingPlannedAssets(plan: CampaignPlan): PlannedAsset[] {
  return plan.phases
    .flatMap((p) => p.assets)
    .filter((a) => a.assetType === "indexing_submit" || a.distributionIntent === "indexing");
}

export async function runProjectIndexSubmit(input: RunProjectIndexInput): Promise<IndexRunResult> {
  const project = await getOrbitProjectById(input.projectId, input.userId);
  if (!project) {
    throw new Error("Orbit project not found");
  }

  const graph = await getOrbitGraph(input.projectId);
  const meta = (project.metadata || {}) as Record<string, unknown>;
  const summary = project.normalizedSummary as Record<string, unknown> | undefined;
  const baseUrl =
    (meta.canonicalUrl as string | undefined) ||
    (summary?.canonicalUrl as string | undefined) ||
    undefined;

  let urls = input.urls?.length
    ? resolveIndexUrls({ entities: graph.entities, explicitUrls: input.urls }, baseUrl)
    : resolveIndexUrls({ entities: graph.entities }, baseUrl);

  if (urls.length === 0) {
    throw new Error("No indexable URLs resolved for project");
  }

  const providers: IndexProvider[] = input.providers?.length
    ? input.providers
    : (["indexnow", "gsc", "google_indexing"] as IndexProvider[]);

  const result: IndexRunResult = {
    projectId: input.projectId,
    campaignId: input.campaignId,
    urls,
    records: [],
    submissions: [],
    probed: 0,
    discoverable: 0,
    failed: 0,
  };

  const probeFirst = input.probeFirst !== false;

  for (const url of urls) {
    let probeStatus: OrbitIndexStatus = "created";
    let probeNotes = "";

    if (probeFirst) {
      const probe = await probeIndexUrl(url);
      result.probed += 1;
      probeStatus = statusAfterProbe("created", probe);
      probeNotes = probe.notes;
      if (probeStatus === "discoverable") result.discoverable += 1;
      if (probeStatus === "failed") result.failed += 1;
    } else {
      probeStatus = "discoverable";
    }

    for (const provider of providers) {
      const record = await upsertOrbitIndexRecord({
        orbitProjectId: input.projectId,
        url,
        provider,
        contentAssetId: input.contentAssetId,
        canonicalUrl: url,
        status: probeStatus,
        lastCheckedAt: probeFirst ? new Date() : undefined,
        nextCheckAt: computeNextCheckAt(probeStatus),
        failureReason: probeStatus === "failed" ? probeNotes : null,
        metadata: { campaignId: input.campaignId },
      });

      result.records.push({
        id: record.id,
        url: record.url,
        provider: provider as IndexProvider,
        status: record.status as OrbitIndexStatus,
      });
    }
  }

  const discoverableUrls = urls.filter((url) => {
    const urlRecords = result.records.filter((r) => r.url === url);
    return urlRecords.some((r) => r.status === "discoverable" || r.status === "created");
  });

  if (discoverableUrls.length === 0) {
    return result;
  }

  const submissions = await submitToProviders(providers, discoverableUrls);
  result.submissions = submissions;

  for (const submission of submissions) {
    for (const url of discoverableUrls) {
      const record = result.records.find(
        (r) => r.url === url && r.provider === submission.provider,
      );
      if (!record) continue;

      const newStatus = statusAfterSubmit(submission.ok);
      await updateIndexRecordStatus(record.id, {
        status: newStatus,
        submittedAt: submission.ok ? new Date() : undefined,
        nextCheckAt: computeNextCheckAt(newStatus),
        failureReason: submission.ok ? null : submission.message,
        metadata: { lastSubmission: submission },
      });
      record.status = newStatus;
    }
  }

  return result;
}

export async function runCampaignIndex(input: RunCampaignIndexInput): Promise<IndexRunResult> {
  const campaign = await getOrbitCampaignById(input.campaignId, input.userId);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const plan = parseCampaignPlan(campaign.planSnapshot as Record<string, unknown> | null);
  const graph = await getOrbitGraph(campaign.orbitProjectId);
  const contentAssets = await listContentAssetsByCampaign(campaign.id);

  const indexingAssets = plan
    ? indexingPlannedAssets(plan)
    : contentAssets
        .filter((a) => a.assetType === "indexing_submit")
        .map(
          (a) =>
            ({
              id: String(a.metadata?.plannedAssetId || a.id),
              assetType: a.assetType,
              distributionIntent: "indexing",
              targetEntityIds: (a.metadata?.targetEntityIds as string[]) || [],
            }) as PlannedAsset,
        );
  const targetEntityIds = indexingAssets.flatMap((a) => a.targetEntityIds || []);
  const contentAssetUrls = contentAssets
    .filter(
      (a) => a.assetType === "indexing_submit" || a.metadata?.distributionIntent === "indexing",
    )
    .map((a) => (a.publishedUrl || a.metadata?.publishedUrl) as string | undefined)
    .filter(Boolean) as string[];

  const indexingContentAsset = contentAssets.find((a) => a.assetType === "indexing_submit");

  const urls = resolveIndexUrls(
    {
      entities: graph.entities,
      targetEntityIds: targetEntityIds.length ? targetEntityIds : undefined,
      contentAssetUrls,
    },
    undefined,
  );

  return runProjectIndexSubmit({
    projectId: campaign.orbitProjectId,
    userId: input.userId,
    urls: urls.length ? urls : undefined,
    providers: input.providers,
    campaignId: campaign.id,
    contentAssetId: indexingContentAsset?.id,
  });
}

export async function getProjectIndexStatus(projectId: string, userId: string) {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) {
    throw new Error("Orbit project not found");
  }
  const records = await listIndexRecordsForProject(projectId);
  const byStatus: Record<string, number> = {};
  for (const r of records) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  }
  return {
    projectId,
    total: records.length,
    byStatus,
    records,
  };
}
