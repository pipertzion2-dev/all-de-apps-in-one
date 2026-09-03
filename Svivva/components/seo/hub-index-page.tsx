import Link from "next/link";
import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-mark";
import { SeoBreadcrumbs } from "@/components/seo/breadcrumbs";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/site-url";
import {
  getHubFeaturePagesForHub,
  type HubFeatureHub,
} from "@/lib/tools/catalogs/hub-feature-pages";
import { hubFeatureDisplayTitle } from "@/lib/tools/hub-feature-seo";

const BASE = getSiteUrl().replace(/\/$/, "");

const HUB_COPY: Record<
  HubFeatureHub,
  { title: string; description: string; h1: string; lead: string }
> = {
  "cyber-security-mini-apps": {
    title: "Free Cyber Security Tools Online | ZZAI",
    description:
      "Free password strength checker, SSL certificate checker, JWT decoder, DNS lookup, and more — one-job security mini-apps, no signup.",
    h1: "Free cyber security tools online",
    lead: "Each checker has its own keyword page so Google can send people looking for a password test or SSL check here — not a generic apps directory.",
  },
  "ai-tools-hub": {
    title: "Free AI Tools Online | ZZAI",
    description:
      "Free AI chat, text summarizer, translator, grammar checker, code explainer, and more — one-job AI mini-apps, no signup.",
    h1: "Free AI tools online",
    lead: "Every tool is its own indexed URL with a specific search keyword. Start with the job you need, then continue on ZZAI for APIs and deploy.",
  },
};

export function hubIndexMetadata(hub: HubFeatureHub): Metadata {
  const copy = HUB_COPY[hub];
  return buildSeoMetadata({
    title: copy.title,
    description: copy.description,
    path: `/${hub}`,
  });
}

export function HubIndexPage({ hub }: { hub: HubFeatureHub }) {
  const copy = HUB_COPY[hub];
  const pages = getHubFeaturePagesForHub(hub);
  const label = hub === "cyber-security-mini-apps" ? "Security Mini Apps" : "AI Tools Hub";

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: copy.h1,
    description: copy.description,
    numberOfItems: pages.length,
    itemListElement: pages.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${BASE}${p.path}`,
      name: hubFeatureDisplayTitle(p),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
      <div className="min-h-screen bg-[#0a0f14] text-white">
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0f14]/95 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 px-6 py-4">
            <Link href="/">
              <BrandMark size="md" href={false} priority />
            </Link>
            <div className="flex items-center gap-5 text-sm">
              <Link href="/tools" className="text-white/70 hover:text-white">
                All tools
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-md bg-[#5B8DA8] text-white font-medium"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-5xl mx-auto px-6 pt-4">
          <SeoBreadcrumbs items={[{ label: "Home", href: "/" }, { label }]} />
        </div>

        <section className="max-w-3xl mx-auto px-6 py-12 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">{copy.h1}</h1>
          <p className="mt-5 text-lg text-white/60 leading-relaxed">{copy.lead}</p>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-20">
          <h2 className="text-xl font-semibold mb-6">{pages.length} indexed feature pages</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pages.map((p) => (
              <li key={p.path}>
                <Link
                  href={p.path}
                  className="block rounded-md border border-white/10 bg-white/5 px-4 py-3 hover:border-[#5B8DA8]/40 transition-colors"
                >
                  <span className="font-medium text-white">{hubFeatureDisplayTitle(p)}</span>
                  <span className="block text-sm text-[#5B8DA8] mt-1">{p.keyword}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
