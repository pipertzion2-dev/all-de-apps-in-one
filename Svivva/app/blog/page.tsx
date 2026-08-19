import type { Metadata } from "next";
import { db } from "@/server/db";
import { blogPosts } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import BlogIndexContent from "./blog-index-content";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildSeoMetadata({
  title: "Blog",
  description:
    "Guides and stories from ZZAI — shipping with guardrails: prompts, schemas, evaluations, versioning, and what we learn along the way.",
  path: "/blog",
});

export default async function BlogIndexPage() {
  let posts: (typeof blogPosts.$inferSelect)[] = [];

  try {
    posts = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(desc(blogPosts.publishedAt));
  } catch (err) {
    console.error("[blog] DB query failed:", err);
  }

  return <BlogIndexContent posts={JSON.parse(JSON.stringify(posts))} />;
}
