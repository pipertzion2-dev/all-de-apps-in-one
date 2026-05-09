"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Wrench } from "lucide-react";
import svivvaLogo from "@/attached_assets/SVIVVA_OFFICIAL_LOGO_1769201341308.png";
import { Badge } from "@/components/ui/badge";

interface SeoPage {
  id: string;
  slug: string;
  keyword: string;
  title: string;
  headline: string;
  subheadline: string | null;
  content: string;
  benefits: string[];
  category: string;
  toolUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  published: boolean;
}

interface PageCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export default function ToolsIndexContent({
  tools,
  categories,
}: {
  tools: SeoPage[];
  categories: PageCategory[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesSearch =
        !searchQuery ||
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.keyword.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "all" || tool.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [tools, searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-[#0a0f14] text-white">
      <nav className="w-full border-b border-white/10 bg-[#0a0f14]/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 px-6 py-4">
          <Link href="/" data-testid="link-home-logo">
            <Image src={svivvaLogo} alt="Svivva" width={120} height={36} priority />
          </Link>
          <div className="flex items-center gap-6 flex-wrap">
            <Link
              href="/tools"
              data-testid="link-nav-tools"
              className="text-sm font-medium text-[#5BA8A0] transition-opacity hover:opacity-80"
            >
              Tools
            </Link>
            <Link
              href="/blog"
              data-testid="link-nav-blog"
              className="text-sm font-medium text-white/70 transition-opacity hover:opacity-80"
            >
              Blog
            </Link>
            <Link
              href="/dashboard"
              data-testid="link-nav-dashboard"
              className="text-sm font-medium px-4 py-2 rounded-md bg-[#5BA8A0] text-white transition-opacity hover:opacity-90"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-6 pt-20 pb-12 text-center">
        <div className="w-14 h-14 rounded-md bg-[#5BA8A0]/20 flex items-center justify-center mx-auto mb-6">
          <Wrench className="w-7 h-7 text-[#5BA8A0]" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight" data-testid="text-hero-title">
          Free AI &amp; Developer Tools
        </h1>
        <p
          className="mt-4 text-lg text-white/60 max-w-2xl mx-auto leading-relaxed"
          data-testid="text-hero-description"
        >
          Explore our collection of free AI-powered tools designed for developers, creators, and
          teams. No signup required.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-8">
        <div className="relative max-w-md mx-auto mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-tools"
            className="w-full pl-10 pr-4 py-2.5 rounded-md bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#5BA8A0]/50"
          />
        </div>

        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          <button
            onClick={() => setActiveCategory("all")}
            data-testid="button-category-all"
            className={`text-sm px-4 py-2 rounded-md transition-colors ${
              activeCategory === "all"
                ? "bg-[#5BA8A0] text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.slug)}
              data-testid={`button-category-${cat.slug}`}
              className={`text-sm px-4 py-2 rounded-md transition-colors ${
                activeCategory === cat.slug
                  ? "bg-[#5BA8A0] text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        {filteredTools.length === 0 ? (
          <div className="text-center py-16" data-testid="text-no-results">
            <p className="text-white/40 text-lg">No tools found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool) => (
              <Link
                key={tool.id}
                href={`/tools/${tool.slug}`}
                data-testid={`card-tool-${tool.slug}`}
                className="group rounded-md border border-white/10 bg-white/5 p-6 hover-elevate transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                  <h3 className="text-lg font-semibold group-hover:text-[#5BA8A0] transition-colors">
                    {tool.title}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="text-xs shrink-0 no-default-hover-elevate no-default-active-elevate"
                    data-testid={`badge-category-${tool.slug}`}
                  >
                    {tool.category}
                  </Badge>
                </div>
                <p
                  className="text-sm text-[#5BA8A0] mb-2"
                  data-testid={`text-keyword-${tool.slug}`}
                >
                  {tool.keyword}
                </p>
                <p className="text-sm text-white/50 leading-relaxed">
                  {tool.content.length > 120 ? tool.content.slice(0, 120) + "..." : tool.content}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/" data-testid="link-footer-home">
            <Image src={svivvaLogo} alt="Svivva" width={90} height={28} />
          </Link>
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} Svivva. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
