import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { scorePageContent } from "@/lib/seo/content-quality/score";
import { emitOrbitEvent } from "../analytics/event-repository";
import { getSiteUrl } from "@/lib/site-url";
import { getOrbitProjectById } from "../ingest";
import {
  embedFusionSpecInContent,
  fusionProductPath,
  fusionSeoSlug,
} from "./fusion-product-spec";
import { parseRoadmapConfig, updateRoadmapItem, touchRoadmapConfig } from "./roadmap-repository";
import { isRoadmapShipCandidate } from "./roadmap-performance";
import type { OrbitRoadmapItem } from "./roadmap-types";

export const DEFAULT_ROADMAP_SHIP_THRESHOLD = 55;

export type ShipFusionProductResult = {
  shipped: number;
  skipped: number;
  items: OrbitRoadmapItem[];
};

function siteBase(): string {
  return getSiteUrl().replace(/\/$/, "");
}

async function upsertFusionProductPage(item: OrbitRoadmapItem): Promise<{
  ok: boolean;
  reason?: string;
  productUrl?: string;
}> {
  if (!item.productSpec) {
    return { ok: false, reason: "Missing product spec — approve roadmap item first" };
  }

  const spec = item.productSpec;
  const seoSlug = fusionSeoSlug(item.slug);
  const productUrl = fusionProductPath(item.slug);
  const base = siteBase();

  const content = embedFusionSpecInContent(
    `<p>${spec.description}</p>
<h2>Fusion workflow</h2>
<ol>${spec.workflowSteps.map((s) => `<li>${s}</li>`).join("")}</ol>
<p>Open the interactive fusion tool at <a href="${base}${productUrl}">${spec.fusionTitle}</a>.</p>`,
    spec,
  );

  const quality = scorePageContent({
    title: spec.fusionTitle,
    content,
    howItWorks: spec.workflowSteps.join(" → "),
    whoItsFor: "Teams running fused ZZAI tool workflows promoted from IFM winners",
    hasFaq: false,
    relatedCount: 2,
  });

  if (!quality.passed) {
    return { ok: false, reason: quality.reasons.join("; ") };
  }

  const values = {
    slug: seoSlug,
    keyword: spec.keyword,
    title: spec.fusionTitle,
    headline: spec.fusionTitle,
    subheadline: spec.description,
    content,
    benefits: [
      `Combines ${spec.toolAName} and ${spec.toolBName}`,
      "Shipped from Orbit IFM product roadmap",
    ],
    howItWorks: spec.workflowSteps.join(" → "),
    whoItsFor: "Builders chaining ZZAI free tools into fused intent workflows",
    relatedSlugs: [spec.toolAPath.replace(/^\/tools\//, ""), spec.toolBPath.replace(/^\/tools\//, "")],
    category: "ifm-fusion-product",
    toolUrl: productUrl,
    metaTitle: `${spec.fusionTitle} — Free fusion tool | ZZAI`,
    metaDescription: `${spec.description} Free on zzaizzai.com.`,
    published: true,
  };

  const [existing] = await db
    .select({ id: seoLandingPages.id })
    .from(seoLandingPages)
    .where(eq(seoLandingPages.slug, seoSlug))
    .limit(1);

  if (existing) {
    await db.update(seoLandingPages).set(values).where(eq(seoLandingPages.id, existing.id));
  } else {
    await db.insert(seoLandingPages).values(values);
  }

  return { ok: true, productUrl };
}

export async function shipApprovedRoadmapItems(
  projectId: string,
  userId: string,
  opts: {
    itemIds?: string[];
    scoreThreshold?: number;
    force?: boolean;
  } = {},
): Promise<ShipFusionProductResult> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const config = parseRoadmapConfig(project.metadata as Record<string, unknown>);
  const threshold =
    opts.scoreThreshold ?? config.shipScoreThreshold ?? DEFAULT_ROADMAP_SHIP_THRESHOLD;

  let candidates = (config.items ?? []).filter((i) => i.status === "approved" && i.productSpec);

  if (opts.itemIds?.length) {
    const ids = new Set(opts.itemIds);
    candidates = candidates.filter((i) => ids.has(i.id));
  }

  if (!opts.force) {
    candidates = candidates.filter((i) => isRoadmapShipCandidate(i, threshold));
  }

  const shipped: OrbitRoadmapItem[] = [];
  const now = new Date().toISOString();

  for (const item of candidates) {
    const upsert = await upsertFusionProductPage(item);
    if (!upsert.ok || !upsert.productUrl) continue;

    const next = await updateRoadmapItem(projectId, userId, item.id, {
      status: "shipped",
      shippedAt: now,
      productUrl: upsert.productUrl,
    });
    if (!next) continue;
    shipped.push(next);

    await emitOrbitEvent({
      orbitProjectId: projectId,
      eventType: "ifm_product_shipped",
      source: "internal",
      idempotencyKey: `roadmap-ship:${projectId}:${item.id}`,
      dimensions: {
        roadmapItemId: item.id,
        pairingId: item.pairingId,
        fusionTitle: item.fusionTitle,
        productUrl: upsert.productUrl,
      },
    });
  }

  if (shipped.length) {
    await touchRoadmapConfig(projectId, userId, { lastShippedAt: now });
  }

  return {
    shipped: shipped.length,
    skipped: (config.items ?? []).length - shipped.length,
    items: shipped,
  };
}
