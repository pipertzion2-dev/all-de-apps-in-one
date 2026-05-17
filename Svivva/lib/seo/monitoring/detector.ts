import { runSiteAudit } from "@/lib/seo/audit/run-audit";
import { getSiteUrl } from "@/lib/site-url";

export type MonitorAlert = {
  id: string;
  severity: "critical" | "warning" | "info";
  message: string;
  patch?: string;
};

export type MonitorReport = {
  ok: boolean;
  alerts: MonitorAlert[];
  metrics: {
    orphanCount: number;
    thinContentCount: number;
    duplicateTitleCount: number;
    nearDuplicateCount: number;
    sitemapUrls: number;
  };
  checkedAt: string;
};

async function fetchStatus(path: string): Promise<number> {
  try {
    const r = await fetch(`${getSiteUrl().replace(/\/$/, "")}${path}`, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Svivva-SEO-Monitor/1.0" },
      cache: "no-store",
    });
    return r.status;
  } catch {
    return 0;
  }
}

export async function runSeoMonitor(): Promise<MonitorReport> {
  const audit = await runSiteAudit();
  const alerts: MonitorAlert[] = [];

  if (audit.orphan_pages.orphans.length > 10) {
    alerts.push({
      id: "orphans",
      severity: "warning",
      message: `${audit.orphan_pages.orphans.length} pages have weak internal links`,
      patch: "POST /api/seo/internal-links/heal",
    });
  }

  if (audit.thin_content.belowThreshold.length > 0) {
    alerts.push({
      id: "thin",
      severity: "warning",
      message: `${audit.thin_content.belowThreshold.length} pages below quality threshold`,
      patch: "Expand content or unpublish thin pages",
    });
  }

  if (audit.duplicate_content.duplicateTitles.length > 0) {
    alerts.push({
      id: "dup-titles",
      severity: "critical",
      message: `${audit.duplicate_content.duplicateTitles.length} duplicate title groups`,
      patch: "Update metaTitle in seo_landing_pages",
    });
  }

  if (audit.duplicate_content.nearDuplicatePairs.length > 5) {
    alerts.push({
      id: "near-dup",
      severity: "critical",
      message: `${audit.duplicate_content.nearDuplicatePairs.length} near-duplicate page pairs`,
      patch: "Merge or differentiate content",
    });
  }

  if (audit.canonical.noindexConflicts.length > 0) {
    alerts.push({
      id: "noindex-sitemap",
      severity: "critical",
      message: "Noindex routes appear in sitemap",
      patch: "Remove from sitemap or allow indexing",
    });
  }

  const hubPaths = ["/ai-tools-hub", "/cyber-security-mini-apps", "/seo-pack"];
  for (const p of hubPaths) {
    const status = await fetchStatus(p);
    if (status === 404) {
      alerts.push({
        id: `404-${p}`,
        severity: "critical",
        message: `Hub ${p} returns 404`,
        patch: "POST /api/orbit/auto-complete or ensure hub pages published",
      });
    }
  }

  const robots = await fetchStatus("/robots.txt");
  if (robots !== 200) {
    alerts.push({
      id: "robots",
      severity: "critical",
      message: "robots.txt unreachable",
    });
  }

  const sitemap = await fetchStatus("/sitemap.xml");
  if (sitemap !== 200) {
    alerts.push({
      id: "sitemap",
      severity: "critical",
      message: "sitemap.xml unreachable",
    });
  }

  return {
    ok: alerts.filter((a) => a.severity === "critical").length === 0,
    alerts,
    metrics: {
      orphanCount: audit.orphan_pages.orphans.length,
      thinContentCount: audit.thin_content.belowThreshold.length,
      duplicateTitleCount: audit.duplicate_content.duplicateTitles.length,
      nearDuplicateCount: audit.duplicate_content.nearDuplicatePairs.length,
      sitemapUrls: audit.site_map.sitemapUrlCount,
    },
    checkedAt: new Date().toISOString(),
  };
}
