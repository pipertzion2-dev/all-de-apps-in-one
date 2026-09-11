/**
 * Repairs SEO pages that block Google from sending traffic:
 * thin doorway pages, duplicate titles, filler slugs.
 */
import { db } from "@/lib/db";
import { blogPosts, seoLandingPages } from "@/lib/schema";
import { eq, like } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";
import { scorePageContent } from "@/lib/seo/content-quality/score";
import { isDuplicateSeoVariantSlug } from "@/lib/seo/duplicate-variants";
import { buildExpandedSeoBody } from "@/lib/seo/page-body";
import { healOrphanInternalLinks } from "@/lib/seo/internal-links/graph";

const BASE = getSiteUrl().replace(/\/$/, "");
const FILLER_PREFIX = "svivva-seo-tool-fill-";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(html: string): number {
  return stripHtml(html).split(/\s+/).filter(Boolean).length;
}

export { buildExpandedSeoBody } from "@/lib/seo/page-body";

export type TrafficQualityRepairResult = {
  summaryLines: string[];
  unpublishedFiller: number;
  unpublishedVariants: number;
  unpublishedDuplicateBlogs: number;
  expandedThin: number;
  duplicateTitlesFixed: number;
  orphansHealed: number;
  sitemapEligible: number;
  stillThin: number;
};

/** Unpublish doorway variants (free-*, *-guide, best-*, etc.) — keep canonical slug only. */
export async function unpublishDuplicateSeoVariants(): Promise<number> {
  const rows = await db
    .select({ id: seoLandingPages.id, slug: seoLandingPages.slug })
    .from(seoLandingPages)
    .where(eq(seoLandingPages.published, true));

  let count = 0;
  for (const row of rows) {
    if (!row.slug || !isDuplicateSeoVariantSlug(row.slug)) continue;
    await db
      .update(seoLandingPages)
      .set({ published: false })
      .where(eq(seoLandingPages.id, row.id));
    count++;
  }
  return count;
}

/** Unpublish blog posts that duplicate another post's title (keep oldest). */
export async function unpublishDuplicateBlogPosts(): Promise<number> {
  const rows = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      createdAt: blogPosts.createdAt,
    })
    .from(blogPosts)
    .where(eq(blogPosts.published, true));

  const byTitle = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = (row.title || "").trim().toLowerCase();
    if (!key) continue;
    const list = byTitle.get(key) ?? [];
    list.push(row);
    byTitle.set(key, list);
  }

  let count = 0;
  for (const [, group] of byTitle) {
    if (group.length < 2) continue;
    group.sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
    for (let i = 1; i < group.length; i++) {
      await db.update(blogPosts).set({ published: false }).where(eq(blogPosts.id, group[i].id));
      count++;
    }
  }
  return count;
}

export async function unpublishFillerPages(): Promise<number> {
  const rows = await db
    .select({ id: seoLandingPages.id })
    .from(seoLandingPages)
    .where(like(seoLandingPages.slug, `${FILLER_PREFIX}%`));
  if (!rows.length) return 0;
  await db
    .update(seoLandingPages)
    .set({ published: false })
    .where(like(seoLandingPages.slug, `${FILLER_PREFIX}%`));
  return rows.length;
}

export async function expandThinPublishedPages(): Promise<{ expanded: number; stillThin: number }> {
  const rows = await db.select().from(seoLandingPages).where(eq(seoLandingPages.published, true));

  let expanded = 0;
  let stillThin = 0;

  for (const row of rows) {
    const words = wordCount(row.content || "");
    const scores = scorePageContent({
      title: row.title,
      content: row.content || "",
      howItWorks: row.howItWorks || undefined,
      whoItsFor: row.whoItsFor || undefined,
      hasFaq: /\[FAQ_JSON\]/i.test(row.content || ""),
    });

    if (scores.passed && words >= 280) continue;

    const body = buildExpandedSeoBody({
      title: row.title,
      keyword: row.keyword || row.title,
      slug: row.slug,
      category: row.category,
      toolUrl: row.toolUrl,
    });

    const uniqueMeta =
      row.metaTitle && !row.metaTitle.includes("|")
        ? `${row.metaTitle} | ${row.slug}`.slice(0, 60)
        : row.metaTitle || `${row.title} | ZZAI`.slice(0, 60);

    await db
      .update(seoLandingPages)
      .set({
        content: body,
        metaTitle: uniqueMeta,
        metaDescription:
          row.metaDescription?.trim() ||
          `Free ${row.title} on ZZAI — ${stripHtml(body).slice(0, 120)}…`.slice(0, 155),
        published: true,
        toolUrl: row.toolUrl || `${BASE}/tools`,
      })
      .where(eq(seoLandingPages.id, row.id));

    const recheck = scorePageContent({
      title: row.title,
      content: body,
      howItWorks: row.howItWorks || undefined,
      whoItsFor: row.whoItsFor || undefined,
      hasFaq: true,
    });
    if (recheck.passed) expanded++;
    else stillThin++;
  }

  return { expanded, stillThin };
}

export async function fixDuplicateMetaTitles(): Promise<number> {
  const rows = await db
    .select({
      id: seoLandingPages.id,
      slug: seoLandingPages.slug,
      metaTitle: seoLandingPages.metaTitle,
      title: seoLandingPages.title,
    })
    .from(seoLandingPages)
    .where(eq(seoLandingPages.published, true));

  const byTitle = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = (row.metaTitle || row.title || "").trim().toLowerCase();
    if (!key) continue;
    const list = byTitle.get(key) ?? [];
    list.push(row);
    byTitle.set(key, list);
  }

  let fixed = 0;
  for (const [, group] of byTitle) {
    if (group.length < 2) continue;
    for (let i = 1; i < group.length; i++) {
      const row = group[i];
      const base = (row.metaTitle || row.title).slice(0, 40);
      const next = `${base} — ${row.slug}`.slice(0, 60);
      await db
        .update(seoLandingPages)
        .set({ metaTitle: next })
        .where(eq(seoLandingPages.id, row.id));
      fixed++;
    }
  }
  return fixed;
}

export async function countSitemapEligiblePages(): Promise<number> {
  const rows = await db
    .select({
      title: seoLandingPages.title,
      content: seoLandingPages.content,
      howItWorks: seoLandingPages.howItWorks,
      whoItsFor: seoLandingPages.whoItsFor,
    })
    .from(seoLandingPages)
    .where(eq(seoLandingPages.published, true));

  let ok = 0;
  for (const row of rows) {
    const scores = scorePageContent({
      title: row.title,
      content: row.content || "",
      howItWorks: row.howItWorks || undefined,
      whoItsFor: row.whoItsFor || undefined,
      hasFaq: /\[FAQ_JSON\]/i.test(row.content || ""),
    });
    if (scores.passed) ok++;
  }
  return ok;
}

/** Full traffic-quality pass — run before IndexNow / GSC submission. */
export async function runTrafficQualityRepair(): Promise<TrafficQualityRepairResult> {
  const summaryLines: string[] = ["═══ Traffic quality repair ═══"];

  const unpublishedFiller = await unpublishFillerPages();
  summaryLines.push(
    unpublishedFiller
      ? `✓ Unpublished ${unpublishedFiller} filler doorway pages (${FILLER_PREFIX}*)`
      : "✓ No filler doorway pages to unpublish",
  );

  const unpublishedVariants = await unpublishDuplicateSeoVariants();
  summaryLines.push(
    unpublishedVariants
      ? `✓ Unpublished ${unpublishedVariants} duplicate SEO variants (guide/free/best/alternative)`
      : "✓ No duplicate SEO variants to unpublish",
  );

  const unpublishedDuplicateBlogs = await unpublishDuplicateBlogPosts();
  summaryLines.push(
    unpublishedDuplicateBlogs
      ? `✓ Unpublished ${unpublishedDuplicateBlogs} duplicate blog posts`
      : "✓ No duplicate blog posts",
  );

  const { expanded: expandedThin, stillThin } = await expandThinPublishedPages();
  summaryLines.push(
    `✓ Expanded ${expandedThin} thin pages to 280+ words with FAQ`,
    stillThin
      ? `⚠ ${stillThin} pages still below quality bar`
      : "✓ All published pages pass quality gate",
  );

  const duplicateTitlesFixed = await fixDuplicateMetaTitles();
  summaryLines.push(
    duplicateTitlesFixed
      ? `✓ Fixed ${duplicateTitlesFixed} duplicate meta titles`
      : "✓ No duplicate meta titles",
  );

  const { updated: orphansHealed } = await healOrphanInternalLinks();
  summaryLines.push(
    orphansHealed
      ? `✓ Healed internal links on ${orphansHealed} pages`
      : "✓ Internal link graph healthy",
  );

  const sitemapEligible = await countSitemapEligiblePages();
  summaryLines.push(`✓ ${sitemapEligible} pages eligible for sitemap (quality gate)`);

  return {
    summaryLines,
    unpublishedFiller,
    unpublishedVariants,
    unpublishedDuplicateBlogs,
    expandedThin,
    duplicateTitlesFixed,
    orphansHealed,
    sitemapEligible,
    stillThin,
  };
}
