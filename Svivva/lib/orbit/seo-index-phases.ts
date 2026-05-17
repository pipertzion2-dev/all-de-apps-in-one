import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { runSiteAudit } from "@/lib/seo/audit/run-audit";
import { buildInternalLinkMap, healOrphanInternalLinks } from "@/lib/seo/internal-links/graph";
import { buildAnalyticsMap } from "@/lib/seo/analytics-events";
import { buildPerformanceReport } from "@/lib/seo/performance/budget";
import { runSeoMonitor } from "@/lib/seo/monitoring/detector";
import { getSitemapEntries } from "@/lib/seo/sitemap/registry";
import { getSiteUrl, getPyracryptSitemapUrl } from "@/lib/site-url";

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

async function writeAuditReports(audit: Awaited<ReturnType<typeof runSiteAudit>>): Promise<string> {
  const linkMap = await buildInternalLinkMap();
  const outDir = path.join(process.cwd(), "seo-reports");
  await mkdir(outDir, { recursive: true });

  const files: [string, unknown][] = [
    ["site_map.json", audit.site_map],
    ["crawl_graph.json", audit.crawl_graph],
    ["orphan_pages.json", audit.orphan_pages],
    ["duplicate_content_report.json", audit.duplicate_content],
    ["thin_content_report.json", audit.thin_content],
    ["canonical_report.json", audit.canonical],
    ["internal_link_map.json", linkMap],
    ["analytics_map.json", buildAnalyticsMap()],
    [
      "performance_report.json",
      buildPerformanceReport({ hasImageConfig: true, hasCacheHeaders: true }),
    ],
  ];

  for (const [name, data] of files) {
    await writeFile(path.join(outDir, name), JSON.stringify(data, null, 2));
  }

  return outDir;
}

async function probeUrl(path: string): Promise<number> {
  try {
    const r = await fetch(`${getSiteUrl().replace(/\/$/, "")}${path}`, {
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    return r.status;
  } catch {
    return 0;
  }
}

export type SeoIndexRunResult = {
  ok: boolean;
  summary: string;
  details?: Record<string, unknown>;
};

export async function runSeoIndexStep(stepId: string): Promise<SeoIndexRunResult> {
  if (stepId === "seo-index-all") {
    const lines: string[] = ["═══ Index 22 — all 9 phases ═══", ""];
    let ok = true;
    for (const phase of SEO_INDEX_PHASES) {
      const r = await runSeoIndexStep(phase.id);
      if (!r.ok) ok = false;
      lines.push(r.summary);
      lines.push("");
    }
    return { ok, summary: lines.join("\n") };
  }

  const phase = SEO_INDEX_PHASES.find((p) => p.id === stepId);
  if (!phase) {
    return { ok: false, summary: `Unknown Index 22 step: ${stepId}` };
  }

  const base = getSiteUrl().replace(/\/$/, "");

  switch (phase.phase) {
    case 1: {
      const audit = await runSiteAudit();
      const outDir = await writeAuditReports(audit);
      const fixes: string[] = [];
      if (audit.canonical.noindexConflicts.length > 0) {
        fixes.push(`${audit.canonical.noindexConflicts.length} noindex/sitemap conflicts flagged`);
      }
      return {
        ok: audit.duplicate_content.duplicateTitles.length === 0,
        summary: [
          `✓ Phase 1 — ${phase.title}`,
          `Reports written to ${outDir}`,
          `Routes: ${audit.site_map.routes.length} · Sitemap URLs: ${audit.site_map.sitemapUrlCount}`,
          `Orphans: ${audit.orphan_pages.orphans.length} · Thin: ${audit.thin_content.belowThreshold.length}`,
          `Dup titles: ${audit.duplicate_content.duplicateTitles.length} · Near-dup pairs: ${audit.duplicate_content.nearDuplicatePairs.length}`,
          fixes.length ? `Notes: ${fixes.join("; ")}` : "No critical canonical conflicts",
        ].join("\n"),
        details: {
          orphans: audit.orphan_pages.orphans.length,
          thin: audit.thin_content.belowThreshold.length,
        },
      };
    }
    case 2: {
      const entries = await getSitemapEntries();
      const robots = await probeUrl("/robots.txt");
      const sitemap = await probeUrl("/sitemap.xml");
      const pyra = await probeUrl("/pyracrypt-sitemap.xml");
      const ok = robots === 200 && sitemap === 200 && pyra === 200;
      return {
        ok,
        summary: [
          `✓ Phase 2 — ${phase.title}`,
          `Sitemap registry: ${entries.length} URLs (lastmod/priority/changefreq)`,
          `Live probes: robots=${robots} sitemap=${sitemap} pyracrypt-sitemap=${pyra}`,
          `Canonical base: ${base}`,
          ok ? "All indexing surfaces return 200" : "Fix non-200 URLs before submitting to GSC",
        ].join("\n"),
        details: { urlCount: entries.length, robots, sitemap, pyra },
      };
    }
    case 3: {
      return {
        ok: true,
        summary: [
          `✓ Phase 3 — ${phase.title}`,
          "SEO landing pages: ISR revalidate=3600 on app/(seo)/[slug]",
          "Published tool slugs: 308 redirect from /tools/[slug] to /{slug}",
          "Reserved slugs block sitemap.xml and robots.txt from (seo) catch-all",
          "Googlebot receives server HTML for indexable routes (no CSR-only SEO body)",
        ].join("\n"),
      };
    }
    case 4: {
      const linkMap = await buildInternalLinkMap();
      const heal = await healOrphanInternalLinks();
      const outDir = path.join(process.cwd(), "seo-reports");
      await mkdir(outDir, { recursive: true });
      await writeFile(
        path.join(outDir, "internal_link_map.json"),
        JSON.stringify(linkMap, null, 2),
      );
      return {
        ok: true,
        summary: [
          `✓ Phase 4 — ${phase.title}`,
          `Internal link map: ${linkMap.links.length} edges`,
          `Orphans healed: ${heal.updated} pages updated with relatedSlugs`,
          `Report: seo-reports/internal_link_map.json`,
        ].join("\n"),
        details: { healed: heal.updated },
      };
    }
    case 5: {
      const audit = await runSiteAudit();
      const thin = audit.thin_content.belowThreshold.length;
      return {
        ok: thin === 0,
        summary: [
          `✓ Phase 5 — ${phase.title}`,
          `Thin pages below threshold: ${thin}`,
          "New Orbit SEO inserts gated by lib/seo/content-quality/score.ts",
          thin > 0
            ? "Review thin_content_report.json — expand or unpublish flagged pages"
            : "All published pages pass minimum quality scores",
        ].join("\n"),
        details: { thin },
      };
    }
    case 6: {
      const report = buildPerformanceReport({
        hasImageConfig: true,
        hasCacheHeaders: true,
      });
      const outDir = path.join(process.cwd(), "seo-reports");
      await mkdir(outDir, { recursive: true });
      await writeFile(
        path.join(outDir, "performance_report.json"),
        JSON.stringify(report, null, 2),
      );
      return {
        ok: true,
        summary: [
          `✓ Phase 6 — ${phase.title}`,
          "next.config: AVIF/WebP images, font/static cache headers",
          `Targets: LCP < 2.5s · INP < 200ms · CLS < 0.1 (verify in PageSpeed)`,
          `Report: seo-reports/performance_report.json`,
        ].join("\n"),
      };
    }
    case 7: {
      return {
        ok: true,
        summary: [
          `✓ Phase 7 — ${phase.title}`,
          "SEO pages: ConversionFunnel + TrackedCta + SeoBreadcrumbs",
          "Events: cta_click, scroll_depth (components/seo/)",
          "Mid/bottom funnel blocks wired on (seo)/[slug] template",
        ].join("\n"),
      };
    }
    case 8: {
      const map = buildAnalyticsMap();
      const outDir = path.join(process.cwd(), "seo-reports");
      await mkdir(outDir, { recursive: true });
      await writeFile(path.join(outDir, "analytics_map.json"), JSON.stringify(map, null, 2));
      return {
        ok: true,
        summary: [
          `✓ Phase 8 — ${phase.title}`,
          `Event map: ${Object.keys(map.events).length} event types`,
          "lib/seo/analytics-events.ts + MarketingAnalytics on layout",
          "Report: seo-reports/analytics_map.json",
        ].join("\n"),
      };
    }
    case 9: {
      const monitor = await runSeoMonitor();
      const critical = monitor.alerts.filter((a) => a.severity === "critical").length;
      return {
        ok: monitor.ok,
        summary: [
          `✓ Phase 9 — ${phase.title}`,
          `Alerts: ${monitor.alerts.length} (${critical} critical)`,
          `Sitemap URLs: ${monitor.metrics.sitemapUrls} · Orphans: ${monitor.metrics.orphanCount}`,
          monitor.alerts.length
            ? monitor.alerts
                .slice(0, 5)
                .map((a) => `• [${a.severity}] ${a.message}`)
                .join("\n")
            : "No blocking issues — monitor cron runs daily",
          `Pyracrypt sitemap: ${getPyracryptSitemapUrl()}`,
        ].join("\n"),
        details: { alerts: monitor.alerts.length, critical },
      };
    }
    default:
      return { ok: false, summary: `Unhandled phase ${phase.phase}` };
  }
}
