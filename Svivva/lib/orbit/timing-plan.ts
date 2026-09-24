/**
 * Orbit Timing — one step at a time, with real waits between indexing pushes.
 * Replaces “submit everything now” with a sequence that matches Google’s quotas and crawl cycles.
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

export const TIMING_PLAN_VERSION = 1;

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
    subtitle: "Tell Google where your URLs live — no bulk URL requests yet.",
    successLooksLike: "GSC → Sitemaps shows https://zzaizzai.com/sitemap.xml as Success or Pending.",
    kind: "automated",
    minHoursAfterPrevious: 0,
  },
  {
    id: "index-batch-1",
    order: 3,
    title: "First crawl nudge (~200 URLs)",
    subtitle: "Rotated IndexNow + one Indexing API batch — not the full sitemap.",
    successLooksLike: "Orbit log shows ~200 URLs submitted; GSC Coverage starts updating over days.",
    kind: "automated",
    minHoursAfterPrevious: 24,
  },
  {
    id: "health-sample",
    order: 4,
    title: "Index health sample",
    subtitle: "Check live pages for noindex/canonical issues before pushing more URLs.",
    successLooksLike: "Health score and problem list — fix any high-severity rows before step 5.",
    kind: "automated",
    minHoursAfterPrevious: 24,
  },
  {
    id: "index-batch-2",
    order: 5,
    title: "Second crawl nudge (~200 URLs)",
    subtitle: "Next least-recently-submitted URLs — stay under ~200/day Indexing API quota.",
    successLooksLike: "Another rotated batch accepted; repeat weekly, not hourly.",
    kind: "automated",
    minHoursAfterPrevious: 48,
  },
  {
    id: "seo-monitor",
    order: 6,
    title: "Technical SEO monitor",
    subtitle: "Orphans, thin pages, sitemap errors — quality before volume.",
    successLooksLike: "Monitor report with zero critical sitemap/canonical alerts.",
    kind: "automated",
    minHoursAfterPrevious: 24,
  },
  {
    id: "adsense-verify",
    order: 7,
    title: "AdSense site status (separate from GSC)",
    subtitle: "Confirm approval + Auto ads in adsense.google.com — paid ads never appear in Search Console.",
    successLooksLike: "AdSense → Sites → zzaizzai.com Ready; Reports show impressions when traffic exists.",
    kind: "manual",
    minHoursAfterPrevious: 0,
  },
  {
    id: "performance-review",
    order: 8,
    title: "Review search performance",
    subtitle: "Read GSC Performance (28 days) — impressions lag indexing by days or weeks.",
    successLooksLike: "At least some queries/pages with impressions, or a clear list of fixes from step 4.",
    kind: "automated",
    minHoursAfterPrevious: 72,
  },
  {
    id: "index-weekly",
    order: 9,
    title: "Weekly indexing rhythm",
    subtitle: "Same rotated batch as step 3/5 — run once per week until coverage is high.",
    successLooksLike: "Coverage % climbs over weeks; stop daily bulk submits.",
    kind: "automated",
    minHoursAfterPrevious: 168,
  },
];

export function getTimingStep(id: string): TimingPlanStep | undefined {
  return TIMING_PLAN_STEPS.find((s) => s.id === id);
}

export function nextTimingStep(completedIds: string[]): TimingPlanStep | null {
  for (const step of TIMING_PLAN_STEPS) {
    if (!completedIds.includes(step.id)) return step;
  }
  return null;
}
