import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { blogPosts } from "@/lib/schema";
import { eq, and, ne } from "drizzle-orm";
import BlogPostContent from "./blog-post-content";

export const dynamic = "force-dynamic";

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
      .where(and(eq(blogPosts.published, true), ne(blogPosts.slug, post.slug), eq(blogPosts.category, post.category)))
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

  return {
    title: post.metaTitle || `${post.title} | Svivva Blog`,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      type: "article",
      ...(post.ogImage ? { images: [post.ogImage] } : {}),
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post);

  const ldJson = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    author: { "@type": "Person", name: post.author },
    datePublished: (post.publishedAt || post.createdAt)?.toISOString(),
    dateModified: post.updatedAt?.toISOString(),
    publisher: { "@type": "Organization", name: "Svivva" },
    ...(post.ogImage ? { image: post.ogImage } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }}
      />
      <BlogPostContent
        post={JSON.parse(JSON.stringify(post))}
        relatedPosts={JSON.parse(JSON.stringify(relatedPosts))}
      />
    </>
  );
}
