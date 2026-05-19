import { resolveOrbitInternalUserId } from "@/lib/orbit/internal-user";
import { fillMarketingGaps, stepCompletionFromCounts } from "@/lib/orbit/fill-marketing-gaps";
import { runAutomatableManualActions } from "@/lib/orbit/automate-manual-actions";
import { ensureOrbitHubPages } from "@/lib/orbit/ensure-hub-pages";
import { healOrphanInternalLinks } from "@/lib/seo/internal-links/graph";
import { runSeoIndexStep } from "@/lib/orbit/seo-index-actions";
import { SEO_INDEX_PHASES } from "@/lib/orbit/seo-index-phases";

export type FullTrafficAutomationResult = {
  summaryLines: string[];
  marketing: Awaited<ReturnType<typeof fillMarketingGaps>>;
  indexing: Awaited<ReturnType<typeof runAutomatableManualActions>>;
  stepCompletion: Record<string, boolean>;
};

/**
 * Maximum automated traffic pass:
 * 1) Create/publish all on-site marketing (SEO, blog, comparisons, 300 tool pages, hub, etc.)
 * 2) IndexNow + Bing + Google sitemap + multi-batch Google Indexing API
 *
 * Does not post to third-party sites (Reddit, Medium, directories) — those need your logins.
 */
export async function runFullTrafficAutomation(): Promise<FullTrafficAutomationResult> {
  const userId = (await resolveOrbitInternalUserId()) || "orbit-admin";
  const summaryLines: string[] = [
    "═══ Full traffic automation (Index 22 + on-site + search engines) ═══",
    "",
    "▸ Index 22 — Search infrastructure (9 phases)",
  ];

  for (const phase of SEO_INDEX_PHASES) {
    const r = await runSeoIndexStep(phase.id);
    summaryLines.push(r.summary.split("\n")[0] ?? phase.title);
    if (!r.ok) summaryLines.push(`  ⚠ ${phase.title} reported issues — see ${phase.id}`);
  }

  summaryLines.push("", "▸ Phase 0 — Hub pages (autopilot URLs)");

  summaryLines.push(...(await ensureOrbitHubPages()));

  const linkHeal = await healOrphanInternalLinks();
  if (linkHeal.updated > 0) {
    summaryLines.push(`▸ Internal links: filled relatedSlugs on ${linkHeal.updated} pages`);
  }

  summaryLines.push("", "▸ Phase 1 — Publish all content on svivva.com (DB)");

  const marketing = await fillMarketingGaps(userId);
  summaryLines.push(...marketing.steps);

  summaryLines.push("", "▸ Phase 2 — Submit every URL to search engines");
  const indexing = await runAutomatableManualActions({ googleMaxBatches: 5 });
  summaryLines.push(...indexing.summaryLines);

  const indexNowOk = marketing.indexNow.ok && indexing.indexNow.ok;
  const stepCompletion = stepCompletionFromCounts({
    ...marketing.counts,
    indexNowKey: true,
    indexNowSubmitted: indexNowOk,
  });

  const onSite =
    marketing.counts.seoPages +
    marketing.counts.blogPosts +
    marketing.counts.seedMarketing +
    marketing.counts.aeoPages;

  summaryLines.push(
    "",
    `▸ On-site: ${onSite}+ pages live · Tools SEO ${marketing.counts.seedMarketing}`,
    indexing.indexNow.ok ? "▸ IndexNow: complete" : "▸ IndexNow: needs attention (see log)",
    indexing.googleSitemap.ok
      ? "▸ Google sitemap API: submitted"
      : "▸ Google: connect service account at /dashboard/gsc-connect for full Google automation",
    "",
    "▸ Still manual: directory paste-ins, Reddit/Medium/PH posts, email outreach (no API keys).",
  );

  return {
    summaryLines,
    marketing,
    indexing,
    stepCompletion,
  };
}
