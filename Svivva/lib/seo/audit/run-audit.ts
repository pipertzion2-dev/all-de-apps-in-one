import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { blogPosts, seoLandingPages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";
import { getSitemapEntries } from "@/lib/seo/sitemap/registry";
import {
  discoverAppRoutes,
  isCrawlablePublicPath,
  isNoindexPath,
  isRobotsDisallowed,
} from "@/lib/seo/audit/route-discovery";
import { scorePageContent } from "@/lib/seo/content-quality/score";

export type SiteAuditReports = {
  site_map: SiteMapReport;
  crawl_graph: CrawlGraphReport;
  orphan_pages: OrphanReport;
  duplicate_content: DuplicateReport;
  thin_content: ThinContentReport;
  canonical: CanonicalReport;
  generatedAt: string;
};

type SiteMapReport = {
  baseUrl: string;
  routes: { path: string; kind: string; indexable: boolean }[];
  sitemapUrlCount: number;
  dbSeoPages: number;
  dbBlogPosts: number;
};

type CrawlGraphReport = {
  nodes: { id: string; type: string; authorityHint: number }[];
  edges: { from: string; to: string; rel: string }[];
};

type OrphanReport = {
  orphans: { path: string; reason: string }[];
};

type DuplicateReport = {
  duplicateTitles: { title: string; paths: string[] }[];
  duplicateDescriptions: { description: string; paths: string[] }[];
  duplicateH1: { h1: string; paths: string[] }[];
  nearDuplicatePairs: { a: string; b: string; similarity: number }[];
  duplicateUrlSurfaces: { canonical: string; duplicates: string[] }[];
};

type ThinContentReport = {
  belowThreshold: {
    path: string;
    slug: string;
    scores: ReturnType<typeof scorePageContent>;
  }[];
  threshold: number;
};

type CanonicalReport = {
  missingCanonical: string[];
  noindexConflicts: { path: string; inSitemap: boolean }[];
  robotsConflicts: { path: string; issue: string }[];
};

function normalizeText(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

function contentFingerprint(text: string): string {
  return createHash("sha256")
    .update(normalizeText(text.slice(0, 2000)))
    .digest("hex")
    .slice(0, 16);
}

function jaccardSimilarity(a: string, b: string): number {
  const wa = new Set(
    normalizeText(a)
      .split(/\W+/)
      .filter((w) => w.length > 3),
  );
  const wb = new Set(
    normalizeText(b)
      .split(/\W+/)
      .filter((w) => w.length > 3),
  );
  if (wa.size === 0 || wb.size === 0) return 0;
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  return inter / (wa.size + wb.size - inter);
}

function groupDuplicates<T extends { path: string }>(
  items: { path: string; key: string }[],
): { key: string; paths: string[] }[] {
  const map = new Map<string, string[]>();
  for (const { path, key } of items) {
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(path);
    map.set(key, list);
  }
  return [...map.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([key, paths]) => ({ key, paths }));
}

export async function runSiteAudit(): Promise<SiteAuditReports> {
  const baseUrl = getSiteUrl().replace(/\/$/, "");
  const appRoutes = await discoverAppRoutes();
  const sitemapEntries = await getSitemapEntries();

  let seoPages: (typeof seoLandingPages.$inferSelect)[] = [];
  let posts: (typeof blogPosts.$inferSelect)[] = [];
  try {
    seoPages = await db.select().from(seoLandingPages).where(eq(seoLandingPages.published, true));
    posts = await db.select().from(blogPosts).where(eq(blogPosts.published, true));
  } catch {
    /* db optional during local audit */
  }

  const sitemapPaths = new Set(sitemapEntries.map((e) => new URL(e.url).pathname));

  const site_map: SiteMapReport = {
    baseUrl,
    routes: appRoutes.map((r) => ({
      path: r.path,
      kind: r.kind,
      indexable: isCrawlablePublicPath(r.path),
    })),
    sitemapUrlCount: sitemapEntries.length,
    dbSeoPages: seoPages.length,
    dbBlogPosts: posts.length,
  };

  const hubSlugs = new Set(["ai-tools-hub", "cyber-security-mini-apps", "seo-pack"]);
  const nodes: CrawlGraphReport["nodes"] = [
    { id: "/", type: "home", authorityHint: 1 },
    { id: "/blog", type: "hub", authorityHint: 0.85 },
    { id: "/tools", type: "hub", authorityHint: 0.85 },
  ];
  const edges: CrawlGraphReport["edges"] = [
    { from: "/", to: "/blog", rel: "nav" },
    { from: "/", to: "/tools", rel: "nav" },
    { from: "/", to: "/ai-tools-hub", rel: "hub" },
  ];

  for (const slug of hubSlugs) {
    nodes.push({ id: `/${slug}`, type: "hub", authorityHint: 0.9 });
    edges.push({ from: "/", to: `/${slug}`, rel: "hub" });
  }

  for (const page of seoPages) {
    const p = `/${page.slug}`;
    nodes.push({ id: p, type: page.category || "seo", authorityHint: 0.6 });
    const hub = hubSlugs.has(page.slug)
      ? null
      : page.category === "seed-marketing"
        ? "/ai-tools-hub"
        : "/tools";
    if (hub) edges.push({ from: hub, to: p, rel: "category" });
    for (const rel of page.relatedSlugs ?? []) {
      edges.push({ from: p, to: `/${rel}`, rel: "related" });
    }
  }

  for (const post of posts) {
    const p = `/blog/${post.slug}`;
    nodes.push({ id: p, type: "article", authorityHint: 0.7 });
    edges.push({ from: "/blog", to: p, rel: "category" });
  }

  const crawl_graph: CrawlGraphReport = { nodes, edges };

  const linked = new Set<string>();
  for (const e of edges) {
    linked.add(e.to);
    linked.add(e.from);
  }
  linked.add("/");

  const orphans: OrphanReport["orphans"] = [];
  for (const page of seoPages) {
    const p = `/${page.slug}`;
    if (!linked.has(p) && !hubSlugs.has(page.slug)) {
      orphans.push({ path: p, reason: "No inbound internal links in graph" });
    }
  }
  for (const entry of sitemapEntries) {
    const p = new URL(entry.url).pathname;
    if (
      !linked.has(p) &&
      p !== "/" &&
      !p.startsWith("/blog/") &&
      !p.startsWith("/tools/category")
    ) {
      orphans.push({ path: p, reason: "In sitemap but weak internal link graph" });
    }
  }

  const titleItems = seoPages.map((p) => ({
    path: `/${p.slug}`,
    key: normalizeText(p.metaTitle || p.title),
  }));
  const descItems = seoPages.map((p) => ({
    path: `/${p.slug}`,
    key: normalizeText(p.metaDescription || p.content.slice(0, 160)),
  }));
  const h1Items = seoPages.map((p) => ({
    path: `/${p.slug}`,
    key: normalizeText(p.headline || p.title),
  }));

  const fingerprints = new Map<string, string[]>();
  for (const page of seoPages) {
    const fp = contentFingerprint(page.content);
    const list = fingerprints.get(fp) ?? [];
    list.push(`/${page.slug}`);
    fingerprints.set(fp, list);
  }

  const nearDuplicatePairs: DuplicateReport["nearDuplicatePairs"] = [];
  for (let i = 0; i < seoPages.length; i++) {
    for (let j = i + 1; j < seoPages.length; j++) {
      const sim = jaccardSimilarity(seoPages[i].content, seoPages[j].content);
      if (sim >= 0.72) {
        nearDuplicatePairs.push({
          a: `/${seoPages[i].slug}`,
          b: `/${seoPages[j].slug}`,
          similarity: Math.round(sim * 100) / 100,
        });
      }
    }
  }

  const duplicate_content: DuplicateReport = {
    duplicateTitles: groupDuplicates(titleItems).map(({ key, paths }) => ({
      title: key,
      paths,
    })),
    duplicateDescriptions: groupDuplicates(descItems).map(({ key, paths }) => ({
      description: key.slice(0, 80),
      paths,
    })),
    duplicateH1: groupDuplicates(h1Items).map(({ key, paths }) => ({ h1: key, paths })),
    nearDuplicatePairs: nearDuplicatePairs.slice(0, 50),
    duplicateUrlSurfaces: seoPages.map((p) => ({
      canonical: `/${p.slug}`,
      duplicates: [`/tools/${p.slug}`],
    })),
  };

  const QUALITY_THRESHOLD = 0.55;
  const belowThreshold: ThinContentReport["belowThreshold"] = [];
  for (const page of seoPages) {
    const scores = scorePageContent({
      title: page.title,
      content: page.content,
      benefits: page.benefits,
      howItWorks: page.howItWorks,
      whoItsFor: page.whoItsFor,
      relatedCount: page.relatedSlugs?.length ?? 0,
    });
    if (scores.overall < QUALITY_THRESHOLD) {
      belowThreshold.push({ path: `/${page.slug}`, slug: page.slug, scores });
    }
  }

  const thin_content: ThinContentReport = {
    belowThreshold,
    threshold: QUALITY_THRESHOLD,
  };

  const missingCanonical: string[] = ["/tools/[slug]"];
  const noindexConflicts: CanonicalReport["noindexConflicts"] = [];
  for (const r of appRoutes) {
    if (isNoindexPath(r.path) && sitemapPaths.has(r.path)) {
      noindexConflicts.push({ path: r.path, inSitemap: true });
    }
  }

  const robotsConflicts: CanonicalReport["robotsConflicts"] = [];
  for (const r of appRoutes) {
    if (isRobotsDisallowed(r.path) && sitemapPaths.has(r.path)) {
      robotsConflicts.push({ path: r.path, issue: "Disallowed in robots but listed in sitemap" });
    }
  }

  const canonical: CanonicalReport = {
    missingCanonical,
    noindexConflicts,
    robotsConflicts,
  };

  return {
    site_map,
    crawl_graph,
    orphan_pages: { orphans },
    duplicate_content,
    thin_content,
    canonical,
    generatedAt: new Date().toISOString(),
  };
}
