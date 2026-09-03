import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { TrackedCta } from "@/components/tracked-cta";
import { SeoBreadcrumbs } from "@/components/seo/breadcrumbs";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/site-url";
import {
  getHubFeaturePage,
  getHubFeaturePagesForHub,
  type HubFeatureHub,
} from "@/lib/tools/catalogs/hub-feature-pages";
import {
  hubFeatureContentWithoutFaq,
  hubFeatureDisplayTitle,
  hubFeatureFaqs,
} from "@/lib/tools/hub-feature-seo";
import FaqSection from "@/app/(seo)/[slug]/faq-section";

export const revalidate = 3600;

const BASE = getSiteUrl().replace(/\/$/, "");

function hubLabel(hub: HubFeatureHub): string {
  return hub === "cyber-security-mini-apps" ? "Security Mini Apps" : "AI Tools Hub";
}

export function generateHubFeatureStaticParams(hub: HubFeatureHub) {
  return getHubFeaturePagesForHub(hub).map((p) => ({ slug: p.slug }));
}

export async function generateHubFeatureMetadata(
  hub: HubFeatureHub,
  slug: string,
): Promise<Metadata> {
  const page = getHubFeaturePage(hub, slug);
  if (!page) return { title: "Page Not Found | ZZAI" };
  return {
    ...buildSeoMetadata({
      title: page.title.includes("ZZAI") ? page.title : `${page.title} | ZZAI`,
      description: page.metaDescription,
      path: page.path,
    }),
    keywords: page.keywords,
  };
}

export function HubFeaturePageView({ hub, slug }: { hub: HubFeatureHub; slug: string }) {
  const page = getHubFeaturePage(hub, slug);
  if (!page) notFound();

  const displayTitle = hubFeatureDisplayTitle(page);
  const mainContent = hubFeatureContentWithoutFaq(page);
  const faqItems = hubFeatureFaqs(page);
  const related = getHubFeaturePagesForHub(hub)
    .filter((p) => p.slug !== slug)
    .slice(0, 8);

  const ldJsonItems: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: displayTitle,
      description: page.metaDescription,
      url: `${BASE}${page.path}`,
      applicationCategory:
        hub === "cyber-security-mini-apps" ? "SecurityApplication" : "WebApplication",
      operatingSystem: "Web",
      keywords: page.keywords.join(", "),
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/OnlineOnly",
      },
      provider: { "@type": "Organization", name: "ZZAI", url: BASE },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE },
        { "@type": "ListItem", position: 2, name: hubLabel(hub), item: `${BASE}/${hub}` },
        {
          "@type": "ListItem",
          position: 3,
          name: displayTitle,
          item: `${BASE}${page.path}`,
        },
      ],
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
            <Link href="/">
              <BrandMark size="md" href={false} priority />
            </Link>
            <div className="flex items-center gap-5 flex-wrap text-sm">
              <Link href={`/${hub}`} className="text-white/70 hover:text-white transition-colors">
                {hubLabel(hub)}
              </Link>
              <Link href="/tools" className="text-white/70 hover:text-white transition-colors">
                Tools
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-md bg-[#5B8DA8] text-white font-medium hover:opacity-90 transition-opacity"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-5xl mx-auto px-6 pt-4">
          <SeoBreadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: hubLabel(hub), href: `/${hub}` },
              { label: displayTitle },
            ]}
          />
        </div>

        <section className="relative py-14 md:py-20 px-6 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#5B8DA8]/10 to-transparent" />
          <div className="relative z-10 max-w-3xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-[#5B8DA8] mb-4">
              Free {page.keyword}
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              {displayTitle}
            </h1>
            <p className="mt-5 text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              {page.metaDescription}
            </p>
            <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
              <TrackedCta
                href="/signup"
                label={`feature_${page.slug}_signup`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#5B8DA8] text-white font-semibold text-lg hover:opacity-90 transition-opacity"
              >
                Start on ZZAI <ArrowRight className="w-5 h-5" />
              </TrackedCta>
              <Link
                href={`/${hub}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-white/20 text-white/80 font-medium hover:bg-white/5 transition-colors"
              >
                More {hubLabel(hub)}
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-10">
          <div
            className="text-white/70 leading-relaxed space-y-4 text-lg prose prose-invert max-w-none
              [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-4
              [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-3
              [&_a]:text-[#5B8DA8] [&_a]:underline-offset-2 hover:[&_a]:underline
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: mainContent }}
          />
        </section>

        {faqItems.length > 0 && (
          <section className="max-w-3xl mx-auto px-6 py-10">
            <h2 className="text-2xl font-bold mb-6 text-center">FAQ</h2>
            <FaqSection items={faqItems} />
          </section>
        )}

        {related.length > 0 && (
          <section className="max-w-4xl mx-auto px-6 py-12 border-t border-white/10">
            <h2 className="text-2xl font-bold mb-6 text-center">More keyword tools</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {related.map((r) => (
                <li key={r.path}>
                  <Link
                    href={r.path}
                    className="block rounded-md border border-white/10 bg-white/5 px-4 py-3 hover:border-[#5B8DA8]/40 transition-colors"
                  >
                    <span className="font-medium text-white">{hubFeatureDisplayTitle(r)}</span>
                    <span className="block text-sm text-white/50 mt-1">{r.keyword}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="border-t border-white/10 py-10 px-6 text-center text-white/40 text-sm">
          <p>
            Indexed feature page on{" "}
            <Link href="/" className="text-[#5B8DA8]">
              zzaizzai.com
            </Link>{" "}
            — not a generic apps directory.
          </p>
        </footer>
      </div>
    </>
  );
}
