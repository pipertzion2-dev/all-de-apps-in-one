import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { orbitAppSeoConfig, orbitPublicApps } from "@/lib/orbit/seo/schema";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Props = { params: Promise<{ slug: string }> };

async function loadApp(slug: string) {
  try {
    const apps = await db
      .select()
      .from(orbitPublicApps)
      .where(
        and(
          eq(orbitPublicApps.slug, slug),
          eq(orbitPublicApps.isPublic, true),
          eq(orbitPublicApps.status, "published"),
        ),
      )
      .limit(1);
    const app = apps[0];
    if (!app) return null;
    const seo = (
      await db.select().from(orbitAppSeoConfig).where(eq(orbitAppSeoConfig.appId, app.id)).limit(1)
    )[0];
    return { app, seo };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const row = await loadApp(slug);
  if (!row) return { title: "App not found", robots: { index: false, follow: false } };
  const { app, seo } = row;
  const origin = getSiteUrl().replace(/\/$/, "");
  const canonical = seo?.canonicalUrl || `${origin}/apps/${app.slug}`;
  const noindex = (seo?.robotsDirective || "").includes("noindex") || !app.indexable;
  return {
    title: seo?.seoTitle || app.name,
    description: seo?.metaDescription || app.description,
    alternates: { canonical },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: seo?.ogTitle || seo?.seoTitle || app.name,
      description: seo?.ogDescription || seo?.metaDescription || app.description,
      url: canonical,
      images: seo?.ogImage ? [{ url: seo.ogImage }] : undefined,
    },
  };
}

export default async function PublicOrbitAppPage({ params }: Props) {
  const { slug } = await params;
  const row = await loadApp(slug);
  if (!row) notFound();
  const { app, seo } = row;
  const faqs = seo?.faqJson || [];
  const features = seo?.keyFeatures || [];

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0f1c24_0%,_#070b0f_55%)] text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14 space-y-10">
        <nav className="text-xs text-muted-foreground">
          <Link href="/apps" className="hover:underline">
            Apps
          </Link>
          <span className="mx-1.5">/</span>
          <span>{app.name}</span>
        </nav>

        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-[#5B8DA8]">{app.category}</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">{app.name}</h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            {seo?.metaDescription || app.description}
          </p>
        </header>

        <section className="space-y-3 prose prose-invert max-w-none">
          <h2 className="text-xl font-semibold">What it does</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {seo?.crawlableBody || app.description}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Who it’s for</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{seo?.whoItsFor}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">How to use it</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{seo?.howToUse}</p>
        </section>

        {features.length ? (
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Key features</h2>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              {features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {app.toolPath ? (
          <section className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
            <h2 className="text-xl font-semibold">Interactive tool</h2>
            <p className="text-xs text-muted-foreground">
              The live mini-app runs on this same URL. Open the tool interface:
            </p>
            <Link
              href={app.toolPath}
              className="inline-flex rounded-md px-3 py-2 text-sm font-medium text-white bg-[#5B8DA8]/90 hover:bg-[#5B8DA8]"
            >
              Launch {app.name}
            </Link>
          </section>
        ) : null}

        {faqs.length ? (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">FAQ</h2>
            <dl className="space-y-3">
              {faqs.map((f) => (
                <div key={f.q} className="rounded-lg border border-white/10 p-3">
                  <dt className="font-medium text-sm">{f.q}</dt>
                  <dd className="text-sm text-muted-foreground mt-1">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {seo?.structuredDataJson ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.structuredDataJson) }}
          />
        ) : null}
      </div>
    </main>
  );
}
