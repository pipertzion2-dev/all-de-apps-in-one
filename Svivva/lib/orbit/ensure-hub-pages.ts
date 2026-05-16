import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";

const BASE = getSiteUrl();

const ORBIT_HUBS: { slug: string; title: string; keyword: string; blurb: string }[] = [
  {
    slug: "ai-tools-hub",
    title: "Svivva AI Tools Hub",
    keyword: "ai tools hub",
    blurb: "Free AI-powered mini apps — all traffic funnels to svivva.com.",
  },
  {
    slug: "cyber-security-mini-apps",
    title: "Cyber Security Mini Apps",
    keyword: "cybersecurity tools",
    blurb: "Security scanners, password tools, and hardening utilities on Svivva.",
  },
  {
    slug: "seo-pack",
    title: "Svivva SEO Pack",
    keyword: "seo tools",
    blurb: "SEO auditing, keyword research, and optimization tools powered by Svivva.",
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

    const content = `<h1>${hub.title}</h1><p>${hub.blurb}</p><p><a href="${BASE}">Explore Svivva &rarr;</a></p><p><a href="${BASE}/tools">All tools &rarr;</a></p>`;

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
