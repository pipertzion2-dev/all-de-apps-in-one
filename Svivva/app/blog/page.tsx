import type { Metadata } from "next";
import { db } from "@/server/db";
import { blogPosts } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import BlogIndexContent from "./blog-index-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Svivva Blog | AI API Development Guides & Tutorials",
  description:
    "Guides, tutorials, and insights on building AI-powered APIs. Learn prompt engineering, schema validation, API versioning, and more.",
  openGraph: {
    title: "Svivva Blog | AI API Development Guides & Tutorials",
    description: "Guides, tutorials, and insights on building AI-powered APIs.",
    type: "website",
  },
};

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
