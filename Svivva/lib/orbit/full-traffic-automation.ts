import { resolveOrbitInternalUserId } from "@/lib/orbit/internal-user";
import { fillMarketingGaps, stepCompletionFromCounts } from "@/lib/orbit/fill-marketing-gaps";
import { runAutomatableManualActions } from "@/lib/orbit/automate-manual-actions";
import { ensureOrbitHubPages } from "@/lib/orbit/ensure-hub-pages";

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
    "═══ Full traffic automation (on-site + search engines) ═══",
    "",
    "▸ Phase 0 — Hub pages (autopilot URLs)",
  ];

  summaryLines.push(...(await ensureOrbitHubPages()));

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
