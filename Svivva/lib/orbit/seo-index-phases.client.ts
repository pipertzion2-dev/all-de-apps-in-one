export const INDEX22_PHASE_COUNT = 9;
export const INDEX22_STORAGE_KEY = "orbit_index22_phase_v1";

export type SeoIndexPhaseDef = {
  id: string;
  phase: number;
  title: string;
  subtitle: string;
  objectives: string[];
  deliverables: string[];
};

/** Nine phases from the Index 22 search-infrastructure prompt. */
export const SEO_INDEX_PHASES: SeoIndexPhaseDef[] = [
  {
    id: "seo-index-1",
    phase: 1,
    title: "Site audit engine",
    subtitle: "Crawl efficiency · map routes, orphans, duplicates, thin content",
    objectives: [
      "Map routes, dynamic routes, sitemaps, internal link graph",
      "Detect duplicate titles, thin pages, canonical conflicts, crawl traps",
      "Auto-fix where safe",
    ],
    deliverables: [
      "site_map.json",
      "crawl_graph.json",
      "orphan_pages.json",
      "duplicate_content_report.json",
      "thin_content_report.json",
      "canonical_report.json",
    ],
  },
  {
    id: "seo-index-2",
    phase: 2,
    title: "Indexing architecture",
    subtitle: "robots.txt · sitemaps · canonical · OG · schema",
    objectives: [
      "robots.txt allow/disallow crawl traps and APIs",
      "sitemap.xml + pyracrypt-sitemap.xml with lastmod/priority",
      "rel=canonical, Open Graph, Twitter, structured data",
    ],
    deliverables: ["/robots.txt", "/sitemap.xml", "/pyracrypt-sitemap.xml", "Schema.org JSON-LD"],
  },
  {
    id: "seo-index-3",
    phase: 3,
    title: "Rendering & discovery",
    subtitle: "SSR / ISR for high-value SEO pages",
    objectives: [
      "SEO landing pages use ISR (revalidate 3600)",
      "Tools redirect to canonical SEO slugs when published",
      "Avoid client-only content on indexable pages",
    ],
    deliverables: ["ISR on (seo)/[slug]", "/tools/[slug] → 308 when hub page exists"],
  },
  {
    id: "seo-index-4",
    phase: 4,
    title: "Internal authority engine",
    subtitle: "Hub → category → tool linking · heal orphans",
    objectives: [
      "Weighted hub/category/tool link graph",
      "Heal orphan pages via relatedSlugs",
      "Breadcrumbs + related sections on SEO pages",
    ],
    deliverables: ["internal_link_map.json", "POST /api/seo/internal-links/heal"],
  },
  {
    id: "seo-index-5",
    phase: 5,
    title: "Content quality engine",
    subtitle: "Reject thin / duplicate / doorway pages",
    objectives: [
      "Semantic depth, uniqueness, and information-gain scores",
      "Gate new Orbit SEO inserts below threshold",
      "Flag thin pages in audit reports",
    ],
    deliverables: ["thin_content_report.json", "insertSeoPage quality gate"],
  },
  {
    id: "seo-index-6",
    phase: 6,
    title: "Performance engine",
    subtitle: "LCP · INP · CLS budgets · cache headers",
    objectives: [
      "Image optimization and cache headers in next.config",
      "performance_report.json with budget checklist",
    ],
    deliverables: ["performance_report.json"],
  },
  {
    id: "seo-index-7",
    phase: 7,
    title: "Conversion system",
    subtitle: "Funnel CTAs · scroll depth · social proof hooks",
    objectives: [
      "Top/mid/bottom funnel components on SEO pages",
      "Tracked CTAs and conversion blocks",
    ],
    deliverables: ["ConversionFunnel", "TrackedCta", "scroll_depth events"],
  },
  {
    id: "seo-index-8",
    phase: 8,
    title: "Event tracking",
    subtitle: "page_view · scroll · CTA · signup · tool_use",
    objectives: ["Unified analytics_map.json", "Marketing analytics wiring"],
    deliverables: ["analytics_map.json"],
  },
  {
    id: "seo-index-9",
    phase: 9,
    title: "Monitoring + self-healing",
    subtitle: "404 spikes · index drops · crawl failures · alerts",
    objectives: [
      "Detect orphans, thin content, duplicate titles, sitemap HTTP errors",
      "Suggest patches (heal links, expand content)",
    ],
    deliverables: ["GET /api/seo/monitor", "cron seo job"],
  },
];

export function isSeoIndexStepId(stepId: string): boolean {
  return stepId === "seo-index-all" || /^seo-index-[1-9]$/.test(stepId);
}
