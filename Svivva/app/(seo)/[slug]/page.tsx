import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { seoLandingPages } from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, ExternalLink } from "lucide-react";
import svivvaLogo from "@/attached_assets/SVIVVA_OFFICIAL_LOGO_1769201341308.png";
import FaqSection from "./faq-section";

import { TrackedCta } from "@/components/tracked-cta";

export const dynamic = "force-dynamic";

type LandingPage = typeof seoLandingPages.$inferSelect;

async function getPage(slug: string): Promise<LandingPage | null> {
  try {
    const [page] = await db
      .select()
      .from(seoLandingPages)
      .where(and(eq(seoLandingPages.slug, slug), eq(seoLandingPages.published, true)))
      .limit(1);
    return page || null;
  } catch (err) {
    console.error("[seo/slug] getPage failed:", err);
    return null;
  }
}

async function getRelatedPages(
  slugs: string[],
): Promise<{ slug: string; title: string; metaDescription: string | null }[]> {
  if (!slugs?.length) return [];
  try {
    return await db
      .select({
        slug: seoLandingPages.slug,
        title: seoLandingPages.title,
        metaDescription: seoLandingPages.metaDescription,
      })
      .from(seoLandingPages)
      .where(and(inArray(seoLandingPages.slug, slugs), eq(seoLandingPages.published, true)))
      .limit(6);
  } catch (err) {
    console.error("[seo/slug] getRelatedPages failed:", err);
    return [];
  }
}

function parseFaq(content: string): { q: string; a: string }[] {
  try {
    const m = content.match(/\[FAQ_JSON\]([\s\S]*?)\[\/FAQ_JSON\]/);
    if (m) return JSON.parse(m[1]);
  } catch {}
  return [];
}

function getContentWithoutFaq(content: string): string {
  return content.replace(/\[FAQ_JSON\][\s\S]*?\[\/FAQ_JSON\]/, "").trim();
}

function isMiniApp(page: LandingPage): boolean {
  return !!page.toolUrl?.startsWith("replit:");
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://svivva.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return { title: "Page Not Found | Svivva" };

  const description = page.metaDescription || getContentWithoutFaq(page.content).slice(0, 160);
  return {
    title: page.metaTitle || `${page.title} | Svivva`,
    description,
    alternates: { canonical: `${BASE_URL}/${slug}` },
    openGraph: {
      title: page.metaTitle || page.title,
      description,
      type: "website",
      url: `${BASE_URL}/${slug}`,
      siteName: "Svivva",
    },
    twitter: { card: "summary_large_image", title: page.metaTitle || page.title, description },
    robots: { index: true, follow: true },
  };
}

export default async function SeoLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  const faqItems = parseFaq(page.content);
  const mainContent = getContentWithoutFaq(page.content);
  const relatedPages = await getRelatedPages(page.relatedSlugs || []);
  const miniApp = isMiniApp(page);

  // Build JSON-LD: WebPage base + SoftwareApplication for mini-app pages + FAQPage if applicable
  const ldJsonItems: object[] = [
    {
      "@context": "https://schema.org",
      "@type": miniApp ? "SoftwareApplication" : "WebPage",
      name: page.title,
      description: page.metaDescription || mainContent.slice(0, 160),
      url: `${BASE_URL}/${slug}`,
      ...(miniApp
        ? {
            applicationCategory: "WebApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
              availability: "https://schema.org/OnlineOnly",
            },
            provider: { "@type": "Organization", name: "Svivva", url: BASE_URL },
          }
        : {
            publisher: { "@type": "Organization", name: "Svivva", url: BASE_URL },
          }),
    },
  ];

  if (faqItems.length > 0) {
    ldJsonItems.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    });
  }

  // BreadcrumbList
  ldJsonItems.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: page.title, item: `${BASE_URL}/${slug}` },
    ],
  });

  return (
    <>
      {ldJsonItems.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
      <div className="min-h-screen bg-[#0a0f14] text-white">
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0f14]/95 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 px-6 py-4">
            <Link href="/" data-testid="link-home-logo">
              <Image src={svivvaLogo} alt="Svivva" width={110} height={34} priority />
            </Link>
            <div className="flex items-center gap-5 flex-wrap text-sm">
              <Link
                href="/blog"
                className="text-white/70 hover:text-white transition-colors"
                data-testid="link-nav-blog"
              >
                Blog
              </Link>
              <Link
                href="/tools"
                className="text-white/70 hover:text-white transition-colors"
                data-testid="link-nav-tools"
              >
                Tools
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-md bg-[#5BA8A0] text-white font-medium hover:opacity-90 transition-opacity"
                data-testid="link-nav-dashboard"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </nav>

        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-6 py-3 text-xs text-white/30 flex items-center gap-1.5">
          <Link href="/" className="hover:text-white/60 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-white/50">{page.title}</span>
        </div>

        {/* Hero */}
        <section className="relative py-16 md:py-24 px-6 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#5BA8A0]/10 to-transparent" />
          <div className="relative z-10 max-w-3xl mx-auto">
            {miniApp && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5BA8A0]/20 text-[#5BA8A0] text-xs font-medium mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5BA8A0]" />
                AI-Powered Tool
              </div>
            )}
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight"
              data-testid="text-hero-headline"
            >
              {page.headline}
            </h1>
            {page.subheadline && (
              <p
                className="mt-5 text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed"
                data-testid="text-hero-subheadline"
              >
                {page.subheadline}
              </p>
            )}
            <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
              <TrackedCta
                href="/dashboard"
                label="start_building_free"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#5BA8A0] text-white font-semibold text-lg hover:opacity-90 transition-opacity"
                data-testid="button-hero-cta"
              >
                Start Building Free <ArrowRight className="w-5 h-5" />
              </TrackedCta>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-white/20 text-white/80 font-medium hover:bg-white/5 transition-colors"
                data-testid="link-hero-learn"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Main content */}
        <section className="max-w-3xl mx-auto px-6 py-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-6" data-testid="text-content-heading">
            {page.title}
          </h2>
          <div
            className="text-white/70 leading-relaxed space-y-4 text-lg"
            data-testid="text-content-body"
            dangerouslySetInnerHTML={{ __html: mainContent }}
          />
        </section>

        {/* Benefits */}
        {page.benefits.length > 0 && (
          <section className="max-w-4xl mx-auto px-6 py-12">
            <h2
              className="text-2xl md:text-3xl font-bold text-center mb-10"
              data-testid="text-benefits-heading"
            >
              {miniApp ? `Why Use ${page.headline.split(":")[0]}` : "Why Choose Svivva"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {page.benefits.map((benefit, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/10 bg-white/5 p-6"
                  data-testid={`card-benefit-${i}`}
                >
                  <div className="w-8 h-8 rounded-md bg-[#5BA8A0]/20 flex items-center justify-center mb-4">
                    <Check className="w-4 h-4 text-[#5BA8A0]" />
                  </div>
                  <p className="text-white/80 leading-relaxed">{benefit}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* How It Works */}
        {page.howItWorks && (
          <section className="max-w-3xl mx-auto px-6 py-12">
            <h2
              className="text-2xl md:text-3xl font-bold mb-6"
              data-testid="text-howitworks-heading"
            >
              How It Works
            </h2>
            <div
              className="text-white/70 leading-relaxed text-lg space-y-4"
              data-testid="text-howitworks-body"
            >
              {page.howItWorks.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        )}

        {/* Who It's For */}
        {page.whoItsFor && (
          <section className="max-w-3xl mx-auto px-6 py-12">
            <h2
              className="text-2xl md:text-3xl font-bold mb-6"
              data-testid="text-whositsfor-heading"
            >
              Who It&apos;s For
            </h2>
            <div
              className="text-white/70 leading-relaxed text-lg space-y-4"
              data-testid="text-whositsfor-body"
            >
              {page.whoItsFor.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        )}

        {/* FAQ with schema */}
        {faqItems.length > 0 && (
          <section className="max-w-3xl mx-auto px-6 py-12">
            <h2
              className="text-2xl md:text-3xl font-bold mb-8 text-center"
              data-testid="text-faq-heading"
            >
              Frequently Asked Questions
            </h2>
            <FaqSection items={faqItems} />
          </section>
        )}

        {/* Related Tools — internal linking */}
        {relatedPages.length > 0 && (
          <section className="max-w-4xl mx-auto px-6 py-12">
            <h2 className="text-2xl font-bold mb-6 text-center" data-testid="text-related-heading">
              Related Tools
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {relatedPages.map((related) => (
                <Link
                  key={related.slug}
                  href={`/${related.slug}`}
                  className="group rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#5BA8A0]/40 p-5 transition-all"
                  data-testid={`link-related-${related.slug}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-white/90 group-hover:text-white transition-colors text-sm leading-snug">
                      {related.title}
                    </p>
                    <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-[#5BA8A0] flex-shrink-0 transition-colors mt-0.5" />
                  </div>
                  {related.metaDescription && (
                    <p className="text-white/40 text-xs mt-2 leading-relaxed line-clamp-2">
                      {related.metaDescription}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section
          className="py-16 px-6 text-center mt-8"
          style={{ background: "linear-gradient(135deg, #5BA8A0 0%, #3d8a82 50%, #6B2C4A 100%)" }}
          data-testid="section-cta"
        >
          <div className="max-w-2xl mx-auto">
            <h2
              className="text-2xl md:text-3xl font-bold text-white mb-4"
              data-testid="text-cta-title"
            >
              {miniApp ? `Try ${page.headline.split(":")[0]} Free` : "Ready to Build Your AI API?"}
            </h2>
            <p className="text-white/80 mb-8 text-lg">
              {miniApp
                ? "Access all 50+ AI tools in one platform. No setup required."
                : "Turn your ideas into production-ready APIs in minutes. No infrastructure setup required."}
            </p>
            <TrackedCta
              href="/dashboard"
              label="create_your_api_now"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-md bg-white text-[#0a0f14] font-bold text-lg hover:bg-white/90 transition-colors"
              data-testid="button-bottom-cta"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </TrackedCta>
          </div>
        </section>

        <footer className="border-t border-white/10 py-8 px-6">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <Link href="/" data-testid="link-footer-home">
              <Image src={svivvaLogo} alt="Svivva" width={80} height={24} />
            </Link>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <Link
                href="/blog"
                className="hover:text-white/70 transition-colors"
                data-testid="link-footer-blog"
              >
                Blog
              </Link>
              <Link
                href="/tools"
                className="hover:text-white/70 transition-colors"
                data-testid="link-footer-tools"
              >
                Tools
              </Link>
              <Link
                href="/dashboard"
                className="hover:text-white/70 transition-colors"
                data-testid="link-footer-dashboard"
              >
                Dashboard
              </Link>
            </div>
            <p className="text-xs text-white/30">&copy; {new Date().getFullYear()} Svivva</p>
          </div>
        </footer>
      </div>
    </>
  );
}
