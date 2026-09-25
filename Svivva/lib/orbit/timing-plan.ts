/**
 * Orbit Timing — one step at a time, with real waits between indexing pushes.
 * Plan v2: professional cadence (small batches, crawl settle, link heal, weekly maintenance).
 */

export type TimingStepKind = "automated" | "manual";

export type TimingPlanStep = {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  /** Plain-language outcome you should see when this step succeeds. */
  successLooksLike: string;
  kind: TimingStepKind;
  /** Minimum hours after the previous completed step before this one may run. */
  minHoursAfterPrevious: number;
};

export const TIMING_PLAN_VERSION = 2;

export const TIMING_PLAN_STEPS: TimingPlanStep[] = [
  {
    id: "foundation-gsc",
    order: 1,
    title: "Connect Search Console (once)",
    subtitle: "Verify zzaizzai.com on the right Google account — rankings live here, not in Orbit ads.",
    successLooksLike:
      "GSC property sc-domain:zzaizzai.com or https://zzaizzai.com/ shows Verified with Owner access.",
    kind: "manual",
    minHoursAfterPrevious: 0,
  },
  {
    id: "foundation-sitemap",
    order: 2,
    title: "Register sitemap (once)",
    subtitle: "Tell Google where URLs live — no bulk URL requests in this step.",
    successLooksLike: "GSC → Sitemaps shows https://zzaizzai.com/sitemap.xml as Success or Pending.",
    kind: "automated",
    minHoursAfterPrevious: 0,
  },
  {
    id: "crawl-settle",
    order: 3,
    title: "Let Google crawl the sitemap (48h)",
    subtitle: "Professional SEOs wait after sitemap submit — no IndexNow or Indexing API yet.",
    successLooksLike:
      "GSC → Pages shows some URLs Discovered (not required to be Indexed yet). You did not bulk-submit URLs.",
    kind: "manual",
    minHoursAfterPrevious: 48,
  },
  {
    id: "baseline-audit",
    order: 4,
    title: "Baseline technical audit",
    subtitle: "Orphans, sitemap reachability, duplicate/thin signals — fix quality before volume.",
    successLooksLike: "Monitor report loaded; note any critical alerts for the next step.",
    kind: "automated",
    minHoursAfterPrevious: 24,
  },
  {
    id: "internal-link-heal",
    order: 5,
    title: "Heal orphan internal links",
    subtitle: "Auto-fill related links so important URLs are reachable before indexing nudges.",
    successLooksLike: "Log shows pages updated or “no orphans” — fewer orphan alerts in GSC over time.",
    kind: "automated",
    minHoursAfterPrevious: 12,
  },
  {
    id: "index-batch-1",
    order: 6,
    title: "First discovery nudge (~45 URLs)",
    subtitle: "IndexNow only — rotated least-recently-submitted URLs, no Indexing API yet.",
    successLooksLike: "Orbit log shows ~45 IndexNow URLs; no sitemap re-submit.",
    kind: "automated",
    minHoursAfterPrevious: 48,
  },
  {
    id: "health-sample",
    order: 7,
    title: "Index health sample",
    subtitle: "Check live pages for noindex/canonical issues before the second nudge.",
    successLooksLike: "Health score and problem list — fix high-severity rows before step 8.",
    kind: "automated",
    minHoursAfterPrevious: 48,
  },
  {
    id: "index-batch-2",
    order: 8,
    title: "Second nudge (~45 IndexNow + ~35 API)",
    subtitle: "Small Indexing API slice — not a full 200-URL daily quota burn.",
    successLooksLike: "Rotated batch accepted; wait days before expecting Performance movement.",
    kind: "automated",
    minHoursAfterPrevious: 72,
  },
  {
    id: "seo-monitor",
    order: 9,
    title: "Technical SEO monitor",
    subtitle: "Re-check orphans, thin pages, sitemap errors — quality before more volume.",
    successLooksLike: "Monitor report with zero critical sitemap/canonical alerts.",
    kind: "automated",
    minHoursAfterPrevious: 48,
  },
  {
    id: "adsense-verify",
    order: 10,
    title: "AdSense site status (separate from GSC)",
    subtitle: "Confirm approval + Auto ads in adsense.google.com — paid ads never appear in Search Console.",
    successLooksLike: "AdSense → Sites → zzaizzai.com Ready; Reports show impressions when traffic exists.",
    kind: "manual",
    minHoursAfterPrevious: 0,
  },
  {
    id: "performance-review",
    order: 11,
    title: "Review search performance",
    subtitle: "Read GSC Performance (28 days) — impressions lag indexing by days or weeks.",
    successLooksLike: "Queries/pages with impressions, or a clear fix list from health/monitor steps.",
    kind: "automated",
    minHoursAfterPrevious: 72,
  },
  {
    id: "index-weekly",
    order: 12,
    title: "Weekly indexing rhythm",
    subtitle: "Same ~45 + ~35 caps — once per week until coverage is high.",
    successLooksLike: "Coverage % climbs over weeks; no daily bulk submits.",
    kind: "automated",
    minHoursAfterPrevious: 168,
  },
];

/** Repeatable maintenance after the full plan is complete (same caps as weekly step). */
export const TIMING_MAINTENANCE_STEP: TimingPlanStep = {
  id: "index-weekly-maintain",
  order: 13,
  title: "Weekly maintenance nudge",
  subtitle: "Same professional caps as step 12 — run at most once per week.",
  successLooksLike: "Another ~45 IndexNow + ~35 Indexing API rotated batch; GSC updates over days.",
  kind: "automated",
  minHoursAfterPrevious: 168,
};

export function getTimingStep(id: string): TimingPlanStep | undefined {
  if (id === TIMING_MAINTENANCE_STEP.id) return TIMING_MAINTENANCE_STEP;
  return TIMING_PLAN_STEPS.find((s) => s.id === id);
}

export function isTimingPlanComplete(completedIds: string[]): boolean {
  return TIMING_PLAN_STEPS.every((s) => completedIds.includes(s.id));
}

export function nextTimingStep(completedIds: string[]): TimingPlanStep | null {
  for (const step of TIMING_PLAN_STEPS) {
    if (!completedIds.includes(step.id)) return step;
  }
  return null;
}
