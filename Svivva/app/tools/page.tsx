import type { Metadata } from "next";
import { Suspense } from "react";
import { db } from "@/server/db";
import { seoLandingPages, pageCategories } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { nativeToolsAsIndexCards } from "@/lib/orbit/mini-app-curation";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import ToolsIndexContent from "./tools-index-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildSeoMetadata({
  title: "Free AI & Developer Tools",
  description:
    "Browse free AI tools, calculators, validators, and security mini-apps on zzaizzai.com — JSON schema validator, API cost calculator, and more. No signup.",
  path: "/tools",
});

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
    <Suspense fallback={<div className="min-h-screen bg-[#0a0f14]" />}>
      <ToolsIndexContent
        tools={JSON.parse(JSON.stringify(mergedTools))}
        categories={JSON.parse(JSON.stringify(categories))}
      />
    </Suspense>
  );
}
