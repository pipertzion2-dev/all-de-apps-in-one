import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { isLegacyBrandSlug } from "@/lib/seo/legacy-paths";
import { nativeToolPathForSlug } from "@/lib/orbit/mini-app-curation";

export type UnpublishedLegacyPage = { slug: string; reason: string };

const LEGACY_REASON = "Legacy brand or reserved slug — canonical hub is /cyber-security-mini-apps";

const NATIVE_TOOL_DUPE_REASON =
  "Root slug duplicates native /tools URL — use canonical /tools path only";

/**
 * Unpublish SEO landing pages that must not be indexed (pyracrypt-*, clutety-*, hub duplicates).
 */
export async function unpublishLegacySeoSlugs(limit = 500): Promise<UnpublishedLegacyPage[]> {
  const published = await db
    .select({ id: seoLandingPages.id, slug: seoLandingPages.slug })
    .from(seoLandingPages)
    .where(eq(seoLandingPages.published, true))
    .limit(limit);

  const unpublished: UnpublishedLegacyPage[] = [];
  for (const page of published) {
    if (!page.slug || !isLegacyBrandSlug(page.slug)) continue;
    await db
      .update(seoLandingPages)
      .set({ published: false })
      .where(eq(seoLandingPages.id, page.id));
    unpublished.push({ slug: page.slug, reason: LEGACY_REASON });
  }
  return unpublished;
}

/** Unpublish /{slug} SEO rows when the real product lives at /tools/{slug}. */
export async function unpublishNativeToolDuplicateSeoSlugs(
  limit = 500,
): Promise<UnpublishedLegacyPage[]> {
  const published = await db
    .select({ id: seoLandingPages.id, slug: seoLandingPages.slug })
    .from(seoLandingPages)
    .where(eq(seoLandingPages.published, true))
    .limit(limit);

  const unpublished: UnpublishedLegacyPage[] = [];
  for (const page of published) {
    if (!page.slug || !nativeToolPathForSlug(page.slug)) continue;
    await db
      .update(seoLandingPages)
      .set({ published: false })
      .where(eq(seoLandingPages.id, page.id));
    unpublished.push({ slug: page.slug, reason: NATIVE_TOOL_DUPE_REASON });
  }
  return unpublished;
}

/** Legacy brand cleanup + native tool duplicate root slugs. */
export async function unpublishSeoSlugHygiene(limit = 500): Promise<UnpublishedLegacyPage[]> {
  const legacy = await unpublishLegacySeoSlugs(limit);
  const seen = new Set(legacy.map((r) => r.slug));
  const nativeDupes = await unpublishNativeToolDuplicateSeoSlugs(limit);
  for (const row of nativeDupes) {
    if (!seen.has(row.slug)) legacy.push(row);
  }
  return legacy;
}
