/**
 * SEO deploy gates — block releases when critical SEO integrity checks fail.
 * Used by seo:audit script and the weekly SEO routine.
 */
import { runSiteAudit } from "@/lib/seo/audit/run-audit";

export type DeployGateIssue = {
  gate: string;
  severity: "critical" | "warning";
  message: string;
  count?: number;
};

export type DeployGateResult = {
  pass: boolean;
  issues: DeployGateIssue[];
  checkedAt: string;
};

/** Run deploy-blocking SEO gates (canonical, robots/sitemap, template quality). */
export async function checkSeoDeployGates(): Promise<DeployGateResult> {
  const audit = await runSiteAudit();
  const issues: DeployGateIssue[] = [];

  if (audit.canonical.noindexConflicts.length > 0) {
    issues.push({
      gate: "canonical_integrity",
      severity: "critical",
      message: "Sitemap URLs conflict with noindex",
      count: audit.canonical.noindexConflicts.length,
    });
  }

  if (audit.canonical.robotsConflicts.length > 0) {
    issues.push({
      gate: "robots_sitemap_consistency",
      severity: "critical",
      message: "Sitemap URLs disallowed by robots.txt",
      count: audit.canonical.robotsConflicts.length,
    });
  }

  if (audit.duplicate_content.duplicateTitles.length > 0) {
    issues.push({
      gate: "unique_titles",
      severity: "critical",
      message: "Duplicate page titles detected",
      count: audit.duplicate_content.duplicateTitles.length,
    });
  }

  if (audit.thin_content.belowThreshold.length > 10) {
    issues.push({
      gate: "template_quality",
      severity: "warning",
      message: "Many pages below content quality threshold",
      count: audit.thin_content.belowThreshold.length,
    });
  }

  if (audit.orphan_pages.orphans.length > 25) {
    issues.push({
      gate: "internal_links",
      severity: "warning",
      message: "High orphan page count — weak internal linking",
      count: audit.orphan_pages.orphans.length,
    });
  }

  const critical = issues.filter((i) => i.severity === "critical");
  return {
    pass: critical.length === 0,
    issues,
    checkedAt: new Date().toISOString(),
  };
}
