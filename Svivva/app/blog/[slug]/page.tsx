import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { articleSchema, breadcrumbSchema } from "@/lib/seo/schema/builders";
import { JsonLd } from "@/components/seo/json-ld";
import { db } from "@/server/db";
import { blogPosts } from "@/lib/schema";
import { eq, and, ne } from "drizzle-orm";
import BlogPostContent from "./blog-post-content";

export const revalidate = 3600;

type BlogPost = typeof blogPosts.$inferSelect;

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)))
      .limit(1);
    return post || null;
  } catch (err) {
    console.error("[blog/slug] getPost failed:", err);
    return null;
  }
}

async function getRelatedPosts(post: BlogPost): Promise<BlogPost[]> {
  try {
    return await db
      .select()
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.published, true),
          ne(blogPosts.slug, post.slug),
          eq(blogPosts.category, post.category),
        ),
      )
      .limit(3);
  } catch (err) {
    console.error("[blog/slug] getRelatedPosts failed:", err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: "Post Not Found | Svivva Blog" };
  }

  return buildSeoMetadata({
    title: post.metaTitle || `${post.title} | Svivva Blog`,
    description: post.metaDescription || post.excerpt,
    path: `/blog/${slug}`,
    type: "article",
    imagePath: post.ogImage || "/svivva-logo.png",
    publishedTime: post.publishedAt?.toISOString(),
    modifiedTime: post.updatedAt?.toISOString(),
    authors: [post.author],
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post);

  const ldJson = [
    articleSchema({
      title: post.title,
      description: post.metaDescription || post.excerpt || "",
      path: `/blog/${post.slug}`,
      author: post.author,
      publishedTime: (post.publishedAt || post.createdAt)?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      image: post.ogImage || undefined,
    }),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
  ];

  return (
    <>
      <JsonLd data={ldJson} />
      <BlogPostContent
        post={JSON.parse(JSON.stringify(post))}
        relatedPosts={JSON.parse(JSON.stringify(relatedPosts))}
      />
    </>
  );
}
