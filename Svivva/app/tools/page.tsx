import type { Metadata } from "next";
import { db } from "@/server/db";
import { seoLandingPages, pageCategories } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { nativeToolsAsIndexCards } from "@/lib/orbit/mini-app-curation";
import ToolsIndexContent from "./tools-index-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Free tools for developers and creators — calculators, validators, and playgrounds. Most need no signup.",
  openGraph: {
    title: "ZZAI tools",
    description:
      "Free tools for developers and creators — explore calculators, validators, and playgrounds on ZZAI.",
    type: "website",
  },
};

export default async function ToolsIndexPage() {
  let tools: (typeof seoLandingPages.$inferSelect)[] = [];
  let categories: (typeof pageCategories.$inferSelect)[] = [];

  try {
    [tools, categories] = await Promise.all([
      db.select().from(seoLandingPages).where(eq(seoLandingPages.published, true)),
      db.select().from(pageCategories),
    ]);
  } catch (err) {
    console.error("[tools] DB query failed:", err);
  }

  const natives = nativeToolsAsIndexCards();
  const nativeSlugs = new Set(natives.map((t) => t.slug));
  const mergedTools = [
    ...natives,
    ...tools
      .filter((t) => t.slug && !nativeSlugs.has(t.slug))
      .map((t) => ({
        id: t.id,
        slug: t.slug,
        keyword: t.keyword,
        title: t.title,
        headline: t.headline,
        subheadline: t.subheadline,
        content: t.content,
        benefits: t.benefits ?? [],
        category: t.category,
        toolUrl: t.toolUrl,
        metaTitle: t.metaTitle,
        metaDescription: t.metaDescription,
        published: t.published,
      })),
  ];

  return (
    <ToolsIndexContent
      tools={JSON.parse(JSON.stringify(mergedTools))}
      categories={JSON.parse(JSON.stringify(categories))}
    />
  );
}
