import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import svivvaLogo from "@/attached_assets/SVIVVA_OFFICIAL_LOGO_1769201341308.png";
import { Badge } from "@/components/ui/badge";
import { db } from "@/server/db";
import { seoLandingPages, pageCategories } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type SeoPage = typeof seoLandingPages.$inferSelect;
type PageCat = typeof pageCategories.$inferSelect;

async function fetchCategory(slug: string): Promise<PageCat | null> {
  try {
    const [cat] = await db
      .select()
      .from(pageCategories)
      .where(eq(pageCategories.slug, slug))
      .limit(1);
    return cat || null;
  } catch {
    return null;
  }
}

async function fetchAllCategories(): Promise<PageCat[]> {
  try {
    return await db.select().from(pageCategories);
  } catch {
    return [];
  }
}

async function fetchToolsByCategory(categorySlug: string): Promise<SeoPage[]> {
  try {
    return await db
      .select()
      .from(seoLandingPages)
      .where(eq(seoLandingPages.category, categorySlug));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategory(slug);
  if (!category) {
    return { title: "Category Not Found | Svivva" };
  }
  return {
    title: category.metaTitle || `${category.name} Tools | Svivva`,
    description:
      category.metaDescription || category.description || `Browse ${category.name} tools on Svivva`,
    openGraph: {
      title: category.metaTitle || `${category.name} Tools | Svivva`,
      description:
        category.metaDescription ||
        category.description ||
        `Browse ${category.name} tools on Svivva`,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, tools, allCategories] = await Promise.all([
    fetchCategory(slug),
    fetchToolsByCategory(slug),
    fetchAllCategories(),
  ]);

  if (!category) {
    return (
      <div className="min-h-screen bg-[#0a0f14] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Category not found</p>
          <Link
            href="/tools"
            className="text-[#5BA8A0] hover:underline"
            data-testid="link-back-tools"
          >
            Browse all tools
          </Link>
        </div>
      </div>
    );
  }

  const otherCategories = allCategories.filter((c) => c.slug !== slug);

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
              className="text-sm font-medium text-white/70 transition-opacity hover:opacity-80"
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

      <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="w-14 h-14 rounded-md bg-[#5BA8A0]/20 flex items-center justify-center mx-auto mb-6">
          <FolderOpen className="w-7 h-7 text-[#5BA8A0]" />
        </div>
        <h1
          className="text-3xl sm:text-4xl font-bold tracking-tight"
          data-testid="text-category-name"
        >
          {category.name}
        </h1>
        {category.description && (
          <p
            className="mt-4 text-lg text-white/60 max-w-2xl mx-auto leading-relaxed"
            data-testid="text-category-description"
          >
            {category.description}
          </p>
        )}
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16">
        {tools.length === 0 ? (
          <div className="text-center py-16" data-testid="text-no-tools">
            <p className="text-white/40 text-lg">No tools in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
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

      {otherCategories.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <h2
            className="text-xl font-bold mb-6 text-center"
            data-testid="text-other-categories-heading"
          >
            Other Categories
          </h2>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {otherCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/tools/category/${cat.slug}`}
                data-testid={`link-category-${cat.slug}`}
                className="text-sm px-4 py-2 rounded-md bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

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
