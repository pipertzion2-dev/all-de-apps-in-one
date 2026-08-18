import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { parseFusionSpecFromContent } from "./fusion-product-spec";
import type { IfmFusionProductSpec } from "./roadmap-types";

export async function getFusionProductBySlug(
  slug: string,
): Promise<{ spec: IfmFusionProductSpec; productUrl: string } | null> {
  const seoSlug = `ifm-fusion-${slug}`;
  const [page] = await db
    .select({
      content: seoLandingPages.content,
      toolUrl: seoLandingPages.toolUrl,
      published: seoLandingPages.published,
    })
    .from(seoLandingPages)
    .where(eq(seoLandingPages.slug, seoSlug))
    .limit(1);

  if (!page?.published) return null;
  const spec = parseFusionSpecFromContent(page.content);
  if (!spec) return null;

  return {
    spec,
    productUrl: page.toolUrl || `/tools/ifm-fusion/${slug}`,
  };
}
