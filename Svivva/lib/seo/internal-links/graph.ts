import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import {
  computeAuthorityScore,
  pickHubForPage,
  suggestRelatedSlugs,
} from "@/lib/seo/internal-links/authority";

export type InternalLinkMap = {
  generatedAt: string;
  links: {
    from: string;
    to: string;
    rel: "hub" | "related" | "category" | "breadcrumb";
    weight: number;
  }[];
  orphanSlugs: string[];
};

export async function buildInternalLinkMap(): Promise<InternalLinkMap> {
  const pages = await db.select().from(seoLandingPages).where(eq(seoLandingPages.published, true));

  const links: InternalLinkMap["links"] = [];
  const inbound = new Map<string, number>();

  for (const page of pages) {
    const from = `/${page.slug}`;
    const hub = pickHubForPage(page);
    const weight = computeAuthorityScore(page);
    links.push({ from: hub, to: from, rel: "hub", weight });
    inbound.set(page.slug, (inbound.get(page.slug) ?? 0) + 1);

    const related = page.relatedSlugs?.length
      ? page.relatedSlugs
      : suggestRelatedSlugs(page, pages, 4);
    for (const rel of related.slice(0, 6)) {
      links.push({ from, to: `/${rel}`, rel: "related", weight: weight * 0.7 });
      inbound.set(rel, (inbound.get(rel) ?? 0) + 1);
    }
  }

  const orphanSlugs = pages.filter((p) => (inbound.get(p.slug) ?? 0) < 1).map((p) => p.slug);

  return {
    generatedAt: new Date().toISOString(),
    links,
    orphanSlugs,
  };
}

/** Auto-fill empty relatedSlugs for orphan prevention (DB write). */
export async function healOrphanInternalLinks(): Promise<{ updated: number }> {
  const pages = await db.select().from(seoLandingPages).where(eq(seoLandingPages.published, true));
  let updated = 0;

  for (const page of pages) {
    if ((page.relatedSlugs?.length ?? 0) >= 2) continue;
    const suggested = suggestRelatedSlugs(page, pages, 4);
    if (!suggested.length) continue;
    await db
      .update(seoLandingPages)
      .set({ relatedSlugs: suggested })
      .where(eq(seoLandingPages.id, page.id));
    updated++;
  }
  return { updated };
}
