import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { emitOrbitEvent } from "../analytics/event-repository";
import { scorePageContent } from "@/lib/seo/content-quality/score";
import { buildIfmBridgePageDraft } from "./bridge-page-generator";
import { getIfmPairingsForProject, replaceIfmPairings } from "./ifm-repository";
import { getOrbitProjectById } from "../ingest";
import type { IfmPairing } from "./ifm-types";

export type ShipIfmBridgeResult = {
  pairingId: string;
  slug: string;
  ok: boolean;
  reason?: string;
  qualityScore?: number;
};

export type ShipIfmBridgesSummary = {
  shipped: number;
  failed: number;
  results: ShipIfmBridgeResult[];
};

async function upsertBridgePage(
  draft: ReturnType<typeof buildIfmBridgePageDraft>,
): Promise<{ ok: boolean; reason?: string; qualityScore?: number }> {
  const quality = scorePageContent({
    title: draft.title,
    content: draft.content,
    benefits: draft.benefits,
    howItWorks: draft.howItWorks,
    whoItsFor: draft.whoItsFor,
    hasFaq: true,
    relatedCount: draft.relatedSlugs.length,
  });

  if (!quality.passed) {
    return { ok: false, reason: quality.reasons.join("; "), qualityScore: quality.overall };
  }

  const [existing] = await db
    .select({ id: seoLandingPages.id })
    .from(seoLandingPages)
    .where(eq(seoLandingPages.slug, draft.slug))
    .limit(1);

  const values = {
    slug: draft.slug,
    keyword: draft.keyword,
    title: draft.title,
    headline: draft.headline,
    subheadline: draft.subheadline,
    content: draft.content,
    benefits: draft.benefits,
    howItWorks: draft.howItWorks,
    whoItsFor: draft.whoItsFor,
    relatedSlugs: draft.relatedSlugs,
    category: draft.category,
    toolUrl: draft.toolUrl,
    metaTitle: draft.metaTitle,
    metaDescription: draft.metaDescription,
    published: true,
  };

  if (existing) {
    await db.update(seoLandingPages).set(values).where(eq(seoLandingPages.id, existing.id));
  } else {
    await db.insert(seoLandingPages).values(values);
  }

  return { ok: true, qualityScore: quality.overall };
}

export async function shipIfmBridgesForProject(
  projectId: string,
  userId: string,
  opts: { pairingIds?: string[]; statusFilter?: IfmPairing["status"][] } = {},
): Promise<ShipIfmBridgesSummary> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const statusFilter = opts.statusFilter ?? ["planned"];
  let pairings = await getIfmPairingsForProject(projectId, userId);
  const allPairings = [...pairings];

  pairings = pairings.filter((p) => statusFilter.includes(p.status));
  if (opts.pairingIds?.length) {
    const ids = new Set(opts.pairingIds);
    pairings = pairings.filter((p) => ids.has(p.id));
  }

  const results: ShipIfmBridgeResult[] = [];
  const shippedIds = new Set<string>();

  for (const pairing of pairings) {
    const draft = buildIfmBridgePageDraft(pairing);
    const upsert = await upsertBridgePage(draft);

    if (!upsert.ok) {
      results.push({
        pairingId: pairing.id,
        slug: draft.slug,
        ok: false,
        reason: upsert.reason,
        qualityScore: upsert.qualityScore,
      });
      continue;
    }

    shippedIds.add(pairing.id);
    results.push({
      pairingId: pairing.id,
      slug: draft.slug,
      ok: true,
      qualityScore: upsert.qualityScore,
    });

    await emitOrbitEvent({
      orbitProjectId: projectId,
      eventType: "ifm_bridge_shipped",
      source: "internal",
      idempotencyKey: `ifm:ship:${projectId}:${pairing.id}`,
      dimensions: { slug: draft.slug, fusionTitle: pairing.fusionTitle },
      metadata: { pairingId: pairing.id, qualityScore: upsert.qualityScore },
    });
  }

  if (shippedIds.size) {
    const merged = allPairings.map((p) =>
      shippedIds.has(p.id) ? { ...p, status: "generated" as const } : p,
    );
    await replaceIfmPairings(projectId, userId, merged);
  }

  return {
    shipped: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };
}
