import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, ArrowRight, Clock, Users, Wrench, Sparkles } from "lucide-react";
import svivvaLogo from "@/attached_assets/SVIVVA_OFFICIAL_LOGO_1769201341308.png";
import { db } from "@/server/db";
import { seoLandingPages } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

type SeoPage = typeof seoLandingPages.$inferSelect;

async function fetchTool(slug: string): Promise<SeoPage | null> {
  try {
    const [page] = await db
      .select()
      .from(seoLandingPages)
      .where(eq(seoLandingPages.slug, slug))
      .limit(1);
    return page || null;
  } catch {
    return null;
  }
}

async function fetchRelatedTools(slugs: string[]): Promise<SeoPage[]> {
  if (!slugs.length) return [];
  try {
    return await db
      .select()
      .from(seoLandingPages)
      .where(inArray(seoLandingPages.slug, slugs.slice(0, 3)));
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
  const tool = await fetchTool(slug);
  if (!tool) {
    return { title: "Tool Not Found | Svivva" };
  }
  return {
    title: tool.metaTitle || `${tool.title} | Svivva`,
    description: tool.metaDescription || tool.content.slice(0, 160),
    openGraph: {
      title: tool.metaTitle || `${tool.title} | Svivva`,
      description: tool.metaDescription || tool.content.slice(0, 160),
      type: "website",
    },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = await fetchTool(slug);

  if (!tool) {
    return (
      <div className="min-h-screen bg-[#0a0f14] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Tool not found</p>
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

  const relatedTools = await fetchRelatedTools(tool.relatedSlugs || []);
  const howItWorksSteps = tool.howItWorks
    ? tool.howItWorks.split("\n").filter((s) => s.trim())
    : [];
  const whoItsForItems = tool.whoItsFor ? tool.whoItsFor.split("\n").filter((s) => s.trim()) : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.title,
    description: tool.metaDescription || tool.content.slice(0, 160),
    url: `https://svivva.com/tools/${tool.slug}`,
    applicationCategory: tool.category,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    operatingSystem: "Web",
  };

  return (
    <div className="min-h-screen bg-[#0a0f14] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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

      <article className="max-w-3xl mx-auto px-6 pt-16 pb-8">
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight"
          data-testid="text-tool-headline"
        >
          {tool.keyword}
        </h1>
        <p className="mt-6 text-lg text-white/60 leading-relaxed" data-testid="text-tool-content">
          {tool.content}
        </p>
      </article>

      <section className="max-w-3xl mx-auto px-6 pb-12">
        <div
          className="rounded-md border border-white/10 bg-white/5 p-8"
          data-testid="section-tool-area"
        >
          {tool.toolUrl ? (
            <div>
              <iframe
                src={tool.toolUrl}
                className="w-full h-[500px] rounded-md border border-white/10 bg-black/20"
                title={tool.title}
                loading="lazy"
                data-testid="iframe-tool"
              />
              <div className="mt-4 text-center">
                <a
                  href={tool.toolUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-launch-tool"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#5BA8A0] text-white font-medium transition-opacity hover:opacity-90"
                >
                  Launch Tool
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-12" data-testid="text-coming-soon">
              <Clock className="w-10 h-10 text-white/20 mx-auto mb-4" />
              <p className="text-xl font-semibold text-white/40">Coming Soon</p>
              <p className="text-sm text-white/30 mt-1">Tool launching soon</p>
            </div>
          )}
        </div>
      </section>

      {tool.benefits && tool.benefits.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 pb-12">
          <h2 className="text-2xl font-bold mb-6" data-testid="text-benefits-heading">
            Benefits
          </h2>
          <ul className="space-y-4">
            {tool.benefits.slice(0, 3).map((benefit, i) => (
              <li key={i} className="flex items-start gap-3" data-testid={`text-benefit-${i}`}>
                <CheckCircle2 className="w-5 h-5 text-[#5BA8A0] shrink-0 mt-0.5" />
                <span className="text-white/70 leading-relaxed">{benefit}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {howItWorksSteps.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 pb-12">
          <h2 className="text-2xl font-bold mb-6" data-testid="text-how-it-works-heading">
            How It Works
          </h2>
          <ol className="space-y-4">
            {howItWorksSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-4" data-testid={`text-step-${i}`}>
                <span className="w-8 h-8 rounded-md bg-[#5BA8A0]/20 text-[#5BA8A0] font-bold text-sm flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-white/70 leading-relaxed pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {whoItsForItems.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 pb-12">
          <h2 className="text-2xl font-bold mb-6" data-testid="text-who-its-for-heading">
            Who It&apos;s For
          </h2>
          <ul className="space-y-3">
            {whoItsForItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3" data-testid={`text-audience-${i}`}>
                <Users className="w-4 h-4 text-[#5BA8A0] shrink-0 mt-1" />
                <span className="text-white/70 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {relatedTools.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 pb-12">
          <h2 className="text-2xl font-bold mb-6" data-testid="text-related-heading">
            Related Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedTools.map((related) => (
              <Link
                key={related.id}
                href={`/tools/${related.slug}`}
                data-testid={`link-related-${related.slug}`}
                className="rounded-md border border-white/10 bg-white/5 p-4 hover-elevate transition-colors"
              >
                <h3 className="font-semibold text-sm mb-1">{related.title}</h3>
                <p className="text-xs text-white/50">{related.content.slice(0, 80)}...</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-3xl mx-auto px-6 pb-16" data-testid="section-cta">
        <div
          className="rounded-2xl overflow-hidden relative"
          style={{
            background: "linear-gradient(135deg, rgba(91,168,160,0.12), rgba(107,44,74,0.12))",
            border: "1px solid rgba(91,168,160,0.25)",
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(to right, #5BA8A0, #6B2C4A)" }}
          />
          <div className="p-8 md:flex md:items-center md:gap-6">
            <div
              className="w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center mb-5 md:mb-0"
              style={{
                background: "rgba(91,168,160,0.15)",
                border: "1px solid rgba(91,168,160,0.3)",
              }}
            >
              <Sparkles className="w-7 h-7 text-[#5BA8A0]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#5BA8A0] mb-1">
                Step 1 complete · Next →
              </p>
              <h3 className="text-xl font-black text-white">Deploy this as a live API in Svivva</h3>
              <p className="text-white/60 text-sm mt-1">
                You just explored what this tool does. Svivva lets you build, deploy, and monitor AI
                APIs like this one — in minutes, no backend required.
              </p>
            </div>
            <Link
              href="/dashboard"
              data-testid="link-cta-dashboard"
              className="mt-5 md:mt-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm shrink-0 transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #5BA8A0, #6B2C4A)" }}
            >
              Start building free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
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
