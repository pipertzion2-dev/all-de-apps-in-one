"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Calendar, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import svivvaLogo from "@/attached_assets/SVIVVA_OFFICIAL_LOGO_1769201341308.png";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = ["All", "Guides", "Tutorials", "Technical", "Business"];

function estimateReadTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogIndexContent({ posts }: { posts: BlogPost[] }) {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredPosts =
    activeCategory === "All"
      ? posts
      : posts.filter(
          (p) => p.category.toLowerCase() === activeCategory.toLowerCase()
        );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav
        className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur px-6 py-4 flex items-center justify-between gap-4"
        data-testid="nav-blog"
      >
        <Link href="/" data-testid="link-logo">
          <Image
            src={svivvaLogo}
            alt="Svivva"
            width={100}
            height={32}
            className="h-7 w-auto object-contain"
          />
        </Link>
        <div className="flex items-center gap-4 flex-wrap">
          <Link
            href="/blog"
            className="text-sm font-medium text-foreground"
            data-testid="link-blog"
          >
            Blog
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-dashboard"
          >
            Dashboard
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <section
        className="relative py-20 px-6 text-center"
        style={{
          background:
            "linear-gradient(135deg, #5BA8A0 0%, #3d8a82 50%, #6B2C4A 100%)",
        }}
        data-testid="section-hero"
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            data-testid="text-blog-title"
          >
            Svivva Blog
          </h1>
          <p
            className="text-lg text-white/80 max-w-xl mx-auto"
            data-testid="text-blog-description"
          >
            Guides, tutorials, and insights on building AI-powered APIs.
            Learn to ship faster with Svivva.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div
          className="flex items-center gap-2 mb-8 flex-wrap"
          data-testid="filter-categories"
        >
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              data-testid={`button-category-${cat.toLowerCase()}`}
              className={
                activeCategory === cat
                  ? "text-white"
                  : ""
              }
              style={
                activeCategory === cat
                  ? { backgroundColor: "#5BA8A0", borderColor: "#5BA8A0" }
                  : undefined
              }
            >
              {cat}
            </Button>
          ))}
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-16" data-testid="text-no-posts">
            <p className="text-muted-foreground text-lg">
              No posts found{activeCategory !== "All" ? ` in ${activeCategory}` : ""}.
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-testid="grid-posts"
          >
            {filteredPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                data-testid={`card-post-${post.slug}`}
              >
                <Card className="p-6 h-full flex flex-col hover-elevate transition-colors">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge
                      variant="secondary"
                      className="text-xs text-white no-default-active-elevate"
                      style={{ backgroundColor: "#6B2C4A" }}
                      data-testid={`badge-category-${post.slug}`}
                    >
                      {post.category}
                    </Badge>
                  </div>
                  <h2
                    className="text-lg font-semibold mb-2 line-clamp-2"
                    data-testid={`text-title-${post.slug}`}
                  >
                    {post.title}
                  </h2>
                  <p
                    className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1"
                    data-testid={`text-excerpt-${post.slug}`}
                  >
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(post.publishedAt || post.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {estimateReadTime(post.content)} min read
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-sm font-medium" style={{ color: "#5BA8A0" }}>
                    Read more <ArrowRight className="h-3 w-3" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
