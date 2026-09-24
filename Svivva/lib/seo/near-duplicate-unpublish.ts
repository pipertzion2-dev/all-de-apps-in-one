import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { scorePageContent } from "@/lib/seo/content-quality/score";

function normalizeText(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

function jaccardSimilarity(a: string, b: string): number {
  const wa = new Set(
    normalizeText(a)
      .split(/\W+/)
      .filter((w) => w.length > 3),
  );
  const wb = new Set(
    normalizeText(b)
      .split(/\W+/)
      .filter((w) => w.length > 3),
  );
  if (wa.size === 0 || wb.size === 0) return 0;
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  return inter / (wa.size + wb.size - inter);
}

function pageQualityScore(row: {
  title: string;
  content: string;
  howItWorks: string | null;
  whoItsFor: string | null;
}): number {
  return scorePageContent({
    title: row.title,
    content: row.content || "",
    howItWorks: row.howItWorks || undefined,
    whoItsFor: row.whoItsFor || undefined,
    hasFaq: /\[FAQ_JSON\]/i.test(row.content || ""),
  }).overall;
}

export type UnpublishedNearDuplicate = { slug: string; keptSlug: string; similarity: number };

/**
 * In each cluster of near-duplicate SEO landing pages, keep the highest-quality page
 * and unpublish the rest (reduces "50 near-duplicate pairs" monitor alerts).
 */
export async function unpublishNearDuplicateSeoPages(
  similarityThreshold = 0.72,
  limit = 400,
): Promise<UnpublishedNearDuplicate[]> {
  const rows = await db
    .select({
      id: seoLandingPages.id,
      slug: seoLandingPages.slug,
      title: seoLandingPages.title,
      content: seoLandingPages.content,
      howItWorks: seoLandingPages.howItWorks,
      whoItsFor: seoLandingPages.whoItsFor,
    })
    .from(seoLandingPages)
    .where(eq(seoLandingPages.published, true))
    .limit(limit);

  const parent = new Map<string, string>();

  function find(id: string): string {
    let p = parent.get(id) ?? id;
    while (parent.has(p) && parent.get(p) !== p) {
      p = parent.get(p)!;
    }
    parent.set(id, p);
    return p;
  }

  function unite(a: string, b: string) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
  }

  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const sim = jaccardSimilarity(rows[i].content || "", rows[j].content || "");
      if (sim >= similarityThreshold) unite(rows[i].id, rows[j].id);
    }
  }

  const clusters = new Map<string, typeof rows>();
  for (const row of rows) {
    const root = find(row.id);
    const list = clusters.get(root) ?? [];
    list.push(row);
    clusters.set(root, list);
  }

  const unpublished: UnpublishedNearDuplicate[] = [];

  for (const group of clusters.values()) {
    if (group.length < 2) continue;
    const ranked = [...group].sort(
      (a, b) => pageQualityScore(b) - pageQualityScore(a) || a.slug.localeCompare(b.slug),
    );
    const keeper = ranked[0];
    for (let i = 1; i < ranked.length; i++) {
      const drop = ranked[i];
      const sim = jaccardSimilarity(keeper.content || "", drop.content || "");
      await db
        .update(seoLandingPages)
        .set({ published: false })
        .where(eq(seoLandingPages.id, drop.id));
      unpublished.push({
        slug: drop.slug,
        keptSlug: keeper.slug,
        similarity: Math.round(sim * 100) / 100,
      });
    }
  }

  return unpublished;
}
