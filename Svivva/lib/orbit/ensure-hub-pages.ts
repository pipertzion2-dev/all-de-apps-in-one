import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";
import { buildHubPageHtml, type HubSlug } from "@/lib/orbit/mini-app-curation";

const BASE = getSiteUrl();

const ORBIT_HUBS: { slug: HubSlug; title: string; keyword: string; blurb: string }[] = [
  {
    slug: "ai-tools-hub",
    title: "Svivva AI Tools Hub",
    keyword: "ai tools hub",
    blurb: "Free AI utilities — funnel to Svivva for schema validation, deploy, and rollback.",
  },
  {
    slug: "cyber-security-mini-apps",
    title: "Cyber Security Mini Apps",
    keyword: "cybersecurity tools",
    blurb: "Security scanners and hardening tools — Clutety for device protection, Svivva for AI backends.",
  },
  {
    slug: "seo-pack",
    title: "Svivva SEO Pack",
    keyword: "seo tools",
    blurb: "SEO helpers plus Orbit autopilot for indexing and growth pages on Svivva.",
  },
];

/** Ensures hub URLs used by Orbit autopilot return HTTP 200 (published SEO pages). */
export async function ensureOrbitHubPages(): Promise<string[]> {
  const steps: string[] = [];

  for (const hub of ORBIT_HUBS) {
    const [row] = await db
      .select({ id: seoLandingPages.id, published: seoLandingPages.published })
      .from(seoLandingPages)
      .where(eq(seoLandingPages.slug, hub.slug))
      .limit(1);

    if (row?.published) continue;

    const content = buildHubPageHtml(hub.slug);

    if (row) {
      await db
        .update(seoLandingPages)
        .set({
          title: hub.title,
          keyword: hub.keyword,
          headline: hub.title,
          howItWorks: hub.blurb,
          content,
          metaTitle: `${hub.title} | Svivva`.slice(0, 60),
          metaDescription: hub.blurb.slice(0, 155),
          published: true,
          toolUrl: `${BASE}/${hub.slug}`,
        })
        .where(eq(seoLandingPages.id, row.id));
      steps.push(`✓ Republished hub: ${hub.slug}`);
    } else {
      try {
        await db.insert(seoLandingPages).values({
          slug: hub.slug,
          title: hub.title,
          keyword: hub.keyword,
          headline: hub.title,
          howItWorks: hub.blurb,
          whoItsFor: "Developers and teams using Svivva",
          content,
          metaTitle: `${hub.title} | Svivva`.slice(0, 60),
          metaDescription: hub.blurb.slice(0, 155),
          category: "seed-marketing",
          published: true,
          toolUrl: `${BASE}/${hub.slug}`,
        });
        steps.push(`✓ Created hub page: ${hub.slug}`);
      } catch {
        steps.push(`⚠ Could not create hub: ${hub.slug}`);
      }
    }
  }

  return steps;
}
