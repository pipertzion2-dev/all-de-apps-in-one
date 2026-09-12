import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { SeoBreadcrumbs } from "@/components/seo/breadcrumbs";

export const revalidate = 3600;

export const metadata: Metadata = buildSeoMetadata({
  title: "ZZAI SEO Pack",
  description:
    "Lightweight SEO helpers on ZZAI — sitemap health, indexing workflows, and Orbit growth autopilot for programmatic pages.",
  path: "/seo-pack",
});

export default function SeoPackHubPage() {
  return (
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
            <Link href="/orbit" className="text-white/70 hover:text-white">
              Orbit
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <SeoBreadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "SEO Pack", href: "/seo-pack" },
          ]}
        />
        <header className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">ZZAI SEO Pack</h1>
          <p className="text-lg text-white/75 leading-relaxed">
            Lightweight SEO helpers on ZZAI. Scale programmatic pages, keep sitemaps and robots.txt
            aligned, and run indexing workflows with Orbit growth autopilot.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">What you get</h2>
          <ul className="list-disc pl-5 space-y-2 text-white/80">
            <li>Canonical tags and structured metadata on every indexable route</li>
            <li>Sitemap.xml and security-sitemap.xml kept in sync with robots.txt</li>
            <li>Orbit autopilot for IndexNow, GSC, and content generation</li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-4 pt-4">
          <Link
            href="/orbit"
            className="inline-flex items-center rounded-lg bg-white text-[#0a0f14] px-5 py-2.5 font-medium hover:bg-white/90"
          >
            Open Orbit
          </Link>
          <Link
            href="/tools"
            className="inline-flex items-center rounded-lg border border-white/20 px-5 py-2.5 font-medium hover:bg-white/5"
          >
            Browse all tools
          </Link>
        </div>
      </main>
    </div>
  );
}
