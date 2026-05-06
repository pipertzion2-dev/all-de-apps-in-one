"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Calendar, User, Copy, Check, ArrowLeft, ArrowRight } from "lucide-react";
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

function renderMarkdown(md: string): string {
  let html = md;

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    return `<pre class="bg-muted rounded-md p-4 overflow-x-auto my-4 text-sm"><code class="language-${lang}">${code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .trim()}</code></pre>`;
  });

  html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>');

  html = html.replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold mt-8 mb-3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-10 mb-4">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-10 mb-4">$1</h1>');

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  html = html.replace(/^\- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');

  html = html.replace(
    /(<li[^>]*>.*<\/li>\n?)+/g,
    (match) => `<ul class="my-4 space-y-1">${match}</ul>`
  );

  html = html.replace(
    /^(?!<[huplo])(.*\S.*)$/gm,
    '<p class="my-3 leading-relaxed">$1</p>'
  );

  return html;
}

export default function BlogPostContent({
  post,
  relatedPosts,
}: {
  post: BlogPost;
  relatedPosts: BlogPost[];
}) {
  const [copied, setCopied] = useState(false);
  const readTime = estimateReadTime(post.content);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav
        className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur px-6 py-4 flex items-center justify-between gap-4"
        data-testid="nav-blog-post"
      >
        <Link href="/" data-testid="link-logo">
          <Image src={svivvaLogo} alt="Svivva" width={100} height={32} className="h-7 w-auto object-contain" />
        </Link>
        <div className="flex items-center gap-4 flex-wrap">
          <Link href="/blog" className="text-sm font-medium text-foreground" data-testid="link-blog">Blog</Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-dashboard">Dashboard</Link>
          <ThemeToggle />
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12" data-testid="article-post">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          data-testid="link-back-blog"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Blog
        </Link>

        <header className="mb-10">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Badge
              variant="secondary"
              className="text-xs text-white no-default-active-elevate"
              style={{ backgroundColor: "#6B2C4A" }}
              data-testid="badge-post-category"
            >
              {post.category}
            </Badge>
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs" data-testid={`badge-tag-${tag}`}>
                {tag}
              </Badge>
            ))}
          </div>

          <h1
            className="text-3xl md:text-4xl font-bold mb-4"
            data-testid="text-post-title"
          >
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1" data-testid="text-post-author">
              <User className="h-3.5 w-3.5" />
              {post.author}
            </span>
            <span className="flex items-center gap-1" data-testid="text-post-date">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(post.publishedAt || post.createdAt)}
            </span>
            <span className="flex items-center gap-1" data-testid="text-post-readtime">
              <Clock className="h-3.5 w-3.5" />
              {readTime} min read
            </span>
          </div>
        </header>

        <div
          className="prose dark:prose-invert max-w-none text-foreground"
          data-testid="content-post-body"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
        />

        <div className="mt-10 pt-6 border-t border-border flex items-center gap-3 flex-wrap">
          <span className="text-sm text-muted-foreground">Share:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            data-testid="button-copy-link"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy Link
              </>
            )}
          </Button>
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12 border-t border-border" data-testid="section-related">
          <h2 className="text-2xl font-bold mb-6" data-testid="text-related-title">Related Posts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((rp) => (
              <Link key={rp.id} href={`/blog/${rp.slug}`} data-testid={`card-related-${rp.slug}`}>
                <Card className="p-6 h-full flex flex-col hover-elevate transition-colors">
                  <Badge
                    variant="secondary"
                    className="text-xs text-white w-fit mb-3 no-default-active-elevate"
                    style={{ backgroundColor: "#6B2C4A" }}
                  >
                    {rp.category}
                  </Badge>
                  <h3 className="text-base font-semibold mb-2 line-clamp-2">{rp.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{rp.excerpt}</p>
                  <div className="mt-3 flex items-center gap-1 text-sm font-medium" style={{ color: "#5BA8A0" }}>
                    Read more <ArrowRight className="h-3 w-3" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section
        className="py-16 px-6 text-center"
        style={{
          background: "linear-gradient(135deg, #5BA8A0 0%, #3d8a82 50%, #6B2C4A 100%)",
        }}
        data-testid="section-cta"
      >
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="absolute inset-0 -z-10 bg-black/40 rounded-md" />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3" data-testid="text-cta-title">
            Build AI APIs faster with Svivva
          </h2>
          <p className="text-white/80 mb-6">
            Turn prompts into production-ready APIs with schema enforcement,
            evaluations, and instant deployment.
          </p>
          <Link href="/dashboard">
            <Button
              size="lg"
              className="text-white border-[#4a9690]"
              style={{ backgroundColor: "#5BA8A0", borderColor: "#5BA8A0" }}
              data-testid="button-cta-dashboard"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
