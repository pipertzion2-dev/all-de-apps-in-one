import Link from "next/link";
import { db } from "@/server/db";
import { blogPosts } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

/** Server-rendered crawlable intro — h1, value prop, and links search engines need on `/`. */
export async function HomepageSeoHead() {
  let recentPosts: { slug: string; title: string }[] = [];
  try {
    recentPosts = await db
      .select({ slug: blogPosts.slug, title: blogPosts.title })
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(8);
  } catch {
    /* db optional at build */
  }

  return (
    <section
      aria-label="About zzai zzai"
      className="border-b border-[#5B8DA8]/20 bg-background/95 px-4 py-3 sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-base font-bold tracking-tight sm:text-lg">
            zzai zzai — From seed to symphony
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Turn a prompt into a deployable AI API. Free AI tools, security mini-apps, and guides
            for developers shipping without a backend.
          </p>
        </div>
        <nav
          aria-label="Discover ZZAI"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm"
        >
          <Link href="/tools" className="text-[#5B8DA8] hover:underline">
            Free tools
          </Link>
          <Link href="/ai-tools-hub" className="text-[#5B8DA8] hover:underline">
            AI Tools Hub
          </Link>
          <Link href="/blog" className="text-[#5B8DA8] hover:underline">
            Blog
          </Link>
          <Link href="/docs" className="text-[#5B8DA8] hover:underline">
            Docs
          </Link>
          <Link href="/signup" className="font-medium text-foreground hover:underline">
            Start free
          </Link>
        </nav>
      </div>
      {recentPosts.length > 0 ? (
        <nav
          aria-label="Latest blog guides"
          className="mx-auto mt-2 max-w-7xl border-t border-[#5B8DA8]/10 pt-2"
        >
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Latest guides
          </p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {recentPosts.map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="hover:text-foreground hover:underline">
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </section>
  );
}
