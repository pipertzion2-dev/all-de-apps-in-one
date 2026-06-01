import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { isLegacyBrandSlug } from "@/lib/seo/legacy-paths";

export type UnpublishedLegacyPage = { slug: string; reason: string };

const REASON = "Legacy brand or reserved slug — canonical hub is /cyber-security-mini-apps";

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
    unpublished.push({ slug: page.slug, reason: REASON });
  }
  return unpublished;
}
