import Link from "next/link";
import { eq, and } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { orbitPublicApps } from "@/lib/orbit/seo/schema";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Orbit Apps Directory — ZZAI mini-apps",
  description:
    "Browse public ZZAI Orbit mini-apps. Each app has a crawlable landing page and interactive tool.",
  alternates: { canonical: `${getSiteUrl().replace(/\/$/, "")}/apps` },
};

export default async function AppsDirectoryPage() {
  let apps: Array<{ slug: string; name: string; description: string; category: string }> = [];
  try {
    apps = await db
      .select({
        slug: orbitPublicApps.slug,
        name: orbitPublicApps.name,
        description: orbitPublicApps.description,
        category: orbitPublicApps.category,
      })
      .from(orbitPublicApps)
      .where(and(eq(orbitPublicApps.isPublic, true), eq(orbitPublicApps.status, "published")));
  } catch {
    apps = [];
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0f1c24_0%,_#070b0f_55%)] text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-[#5B8DA8]">Orbit directory</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Public mini-apps</h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Crawlable internal links to every published Orbit mini-app at{" "}
            <code className="text-xs">/apps/&#123;slug&#125;</code>.
          </p>
        </header>

        {apps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No public apps published yet. Orbit Admin → SEO can sync and publish curated mini-apps.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {apps.map((app) => (
              <li key={app.slug}>
                <Link
                  href={`/apps/${app.slug}`}
                  className="block rounded-xl border border-white/10 bg-black/25 p-4 hover:border-[#5B8DA8]/50 transition-colors h-full"
                >
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {app.category}
                  </p>
                  <p className="font-medium mt-1">{app.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                    {app.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
