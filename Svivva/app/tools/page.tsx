import type { Metadata } from "next";
import { db } from "@/server/db";
import { seoLandingPages, pageCategories } from "@/lib/schema";
import { eq } from "drizzle-orm";
import ToolsIndexContent from "./tools-index-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Free tools for developers and creators — calculators, validators, and playgrounds. Most need no signup.",
  openGraph: {
    title: "Svivva tools",
    description:
      "Free tools for developers and creators — explore calculators, validators, and playgrounds on Svivva.",
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

  return (
    <ToolsIndexContent
      tools={JSON.parse(JSON.stringify(tools))}
      categories={JSON.parse(JSON.stringify(categories))}
    />
  );
}
