/**
 * Customer acquisition automation — the “do it all” layer for traffic + growth assets.
 * Called from urrthang (marketing autopilot), Acquire tab, and Orbit launch finish.
 */
import { db } from "@/lib/db";
import { growthTasks } from "@/lib/schema";
import { marketingAmplifyJobs } from "@/lib/marketing/schema";
import { createCampaign } from "@/lib/marketing/campaigns";
import { createReferral } from "@/lib/marketing/referrals";
import { createUtmLink, buildUtmUrl } from "@/lib/marketing/utm";
import { runDueChannelIntelWatches } from "@/lib/marketing/channel-intel-watch";
import {
  ACQUISITION_PLAYBOOKS,
  CUSTOMER_ACQUISITION_VERSION,
  defaultAcquisitionUtmPresets,
} from "@/lib/orbit/customer-acquisition";
import {
  buildGrowthIntelligenceReport,
  formatGrowthIntelSummary,
} from "@/lib/orbit/growth-intelligence";
import { runFullTrafficAutomation } from "@/lib/orbit/full-traffic-automation";
import { getSiteUrl, getSitemapUrl, getSecuritySitemapUrl } from "@/lib/site-url";
import { getInternalAppOrigin } from "@/lib/internal-app-origin";

export type AcquisitionAutomationStepStatus = "done" | "prepared" | "failed" | "skipped";

export type AcquisitionAutomationStep = {
  id: string;
  label: string;
  status: AcquisitionAutomationStepStatus;
  message: string;
  url?: string;
  copyText?: string;
};

export type CustomerAcquisitionAutomationResult = {
  ok: boolean;
  version: string;
  startedAt: string;
  finishedAt: string;
  steps: AcquisitionAutomationStep[];
  summary: string;
  stats: {
    done: number;
    prepared: number;
    failed: number;
    skipped: number;
  };
  /** Populated when includeTrafficBlast ran */
  traffic?: {
    onSitePages: number;
    indexNowOk: boolean;
    googleSitemapOk: boolean;
  };
};

export type RunCustomerAcquisitionOptions = {
  /** Publish SEO pages + IndexNow/Google/Bing (default true for standalone Do-it-all) */
  includeTrafficBlast?: boolean;
  /** Skip traffic when nested inside marketing autopilot (already ran Phase 1) */
  skipTrafficBlast?: boolean;
  includeGrowthIntel?: boolean;
  includeChannelIntel?: boolean;
  includeAmplify?: boolean;
  includeUtms?: boolean;
  includeReferral?: boolean;
  includeCampaigns?: boolean;
  includeSitemapPings?: boolean;
  referrerEmail?: string;
  amplifySource?: string;
};

const DEFAULT_AMPLIFY = `ZZAI ships free AI tools and security mini-apps so founders go from idea to live product without a $500/hr agency.

Start free: ${getSiteUrl()}/ai-tools-hub
Build with Seeds: ${getSiteUrl()}/dashboard/seeds
Security tools: ${getSiteUrl()}/cyber-security-mini-apps`;

function step(
  id: string,
  label: string,
  status: AcquisitionAutomationStepStatus,
  message: string,
  opts?: { url?: string; copyText?: string },
): AcquisitionAutomationStep {
  return { id, label, status, message, url: opts?.url, copyText: opts?.copyText };
}

function statsFrom(steps: AcquisitionAutomationStep[]) {
  return {
    done: steps.filter((s) => s.status === "done").length,
    prepared: steps.filter((s) => s.status === "prepared").length,
    failed: steps.filter((s) => s.status === "failed").length,
    skipped: steps.filter((s) => s.status === "skipped").length,
  };
}

async function amplifyForAcquisition(
  sourceContent: string,
  channels: string[],
): Promise<{
  outputs: Array<{ channel: string; content: string; status: string }>;
  jobId?: string;
}> {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const site = getSiteUrl();

  const prompts: Record<string, string> = {
    twitter:
      "Rewrite as a punchy Twitter/X thread (5-7 tweets). Hook first. End with a CTA to the free tools hub.",
    linkedin:
      "Rewrite as a professional LinkedIn post. Insight first, short paragraphs, clear CTA.",
    email: "Rewrite as a marketing email with Subject, preview, body, and CTA button label.",
    reddit:
      "Rewrite as a genuine builder Reddit post (no hype). Soft-mention the free tool with a link.",
  };

  const outputs: Array<{ channel: string; content: string; status: string }> = [];

  for (const channel of channels) {
    const prompt = prompts[channel] ?? "Rewrite this for marketing distribution.";
    if (!apiKey) {
      outputs.push({
        channel,
        content: `[${channel} draft]\n\n${sourceContent.slice(0, 1000)}\n\n→ ${site}`,
        status: "prepared",
      });
      continue;
    }
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: sourceContent },
          ],
          max_tokens: 800,
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) throw new Error(`OpenAI ${res.status}`);
      const data = await res.json();
      outputs.push({
        channel,
        content: data.choices?.[0]?.message?.content ?? "",
        status: "done",
      });
    } catch {
      outputs.push({
        channel,
        content: `[Fallback ${channel}]\n\n${sourceContent.slice(0, 800)}\n\n→ ${site}`,
        status: "prepared",
      });
    }
  }

  try {
    const [job] = await db
      .insert(marketingAmplifyJobs)
      .values({
        sourceContent,
        sourceType: "orbit_do_it_all",
        channels,
        outputs,
        status: "done",
      })
      .returning();
    return { outputs, jobId: job?.id };
  } catch {
    return { outputs };
  }
}

async function pingSitemaps(): Promise<AcquisitionAutomationStep[]> {
  const steps: AcquisitionAutomationStep[] = [];
  const targets = [
    { id: "acq-sitemap-main", label: "Bing sitemap ping (main)", url: getSitemapUrl() },
    {
      id: "acq-sitemap-security",
      label: "Bing sitemap ping (security)",
      url: getSecuritySitemapUrl(),
    },
  ];
  for (const t of targets) {
    try {
      const r = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(t.url)}`, {
        signal: AbortSignal.timeout(8000),
      });
      steps.push(
        step(t.id, t.label, r.ok || r.status < 500 ? "done" : "failed", `HTTP ${r.status}`),
      );
    } catch (e) {
      steps.push(
        step(t.id, t.label, "failed", e instanceof Error ? e.message : "ping failed"),
      );
    }
  }

  // IndexNow via internal origin when possible
  try {
    const origin = getInternalAppOrigin();
    const secret = process.env.ORBIT_INTERNAL_SECRET || "";
    const r = await fetch(`${origin}/api/indexnow/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "x-internal-secret": secret } : {}),
      },
      signal: AbortSignal.timeout(60_000),
    });
    const d = (await r.json().catch(() => ({}))) as { urlCount?: number; error?: string };
    steps.push(
      step(
        "acq-indexnow-batch",
        "IndexNow URL batch",
        r.ok ? "done" : "failed",
        r.ok ? `Submitted ${d.urlCount ?? "?"} URLs` : d.error || `HTTP ${r.status}`,
      ),
    );
  } catch (e) {
    steps.push(
      step(
        "acq-indexnow-batch",
        "IndexNow URL batch",
        "failed",
        e instanceof Error ? e.message : "IndexNow failed",
      ),
    );
  }

  return steps;
}

/**
 * Strong acquisition automation: traffic blast + tracked links + amplify + campaigns + intel.
 */
export async function runCustomerAcquisitionAutomation(
  opts: RunCustomerAcquisitionOptions = {},
): Promise<CustomerAcquisitionAutomationResult> {
  const startedAt = new Date().toISOString();
  const steps: AcquisitionAutomationStep[] = [];
  let trafficMeta: CustomerAcquisitionAutomationResult["traffic"];

  const includeTraffic =
    opts.skipTrafficBlast === true
      ? false
      : opts.includeTrafficBlast !== false; /* default ON for Do-it-all */

  const includeGrowthIntel = opts.includeGrowthIntel !== false;
  const includeChannelIntel = opts.includeChannelIntel !== false;
  const includeAmplify = opts.includeAmplify !== false;
  const includeUtms = opts.includeUtms !== false;
  const includeReferral = opts.includeReferral !== false;
  const includeCampaigns = opts.includeCampaigns !== false;
  const includeSitemapPings = opts.includeSitemapPings !== false;

  // ── 1. Traffic blast (SEO pages + indexing) ───────────────────────────────
  if (includeTraffic) {
    try {
      const traffic = await runFullTrafficAutomation();
      const onSite =
        traffic.marketing.counts.seoPages +
        traffic.marketing.counts.blogPosts +
        traffic.marketing.counts.seedMarketing +
        traffic.marketing.counts.aeoPages;
      trafficMeta = {
        onSitePages: onSite,
        indexNowOk: traffic.indexing.indexNow.ok,
        googleSitemapOk: traffic.indexing.googleSitemap.ok,
      };
      steps.push(
        step(
          "acq-traffic-blast",
          "SEO traffic blast",
          "done",
          `On-site ${onSite}+ pages · IndexNow ${traffic.indexing.indexNow.ok ? "ok" : "needs attention"} · GSC sitemap ${traffic.indexing.googleSitemap.ok ? "ok" : "pending"}`,
        ),
      );
    } catch (e) {
      steps.push(
        step(
          "acq-traffic-blast",
          "SEO traffic blast",
          "failed",
          e instanceof Error ? e.message.slice(0, 200) : String(e),
        ),
      );
    }
  } else {
    steps.push(
      step(
        "acq-traffic-blast",
        "SEO traffic blast",
        "skipped",
        "Skipped — already covered by urrthang / prior traffic pass",
      ),
    );
  }

  // ── 2. Extra sitemap / IndexNow pings (when not just nested) ──────────────
  if (includeSitemapPings && !opts.skipTrafficBlast) {
    steps.push(...(await pingSitemaps()));
  }

  // ── 3. UTM presets (all channels ready to paste) ──────────────────────────
  if (includeUtms) {
    const presets = defaultAcquisitionUtmPresets();
    let created = 0;
    const urls: string[] = [];
    for (const preset of presets) {
      try {
        await createUtmLink({ ...preset });
        const full = buildUtmUrl({ ...preset });
        urls.push(`${preset.name}: ${full}`);
        created++;
      } catch {
        /* duplicate / DB flake — continue */
      }
    }
    steps.push(
      step(
        "acq-utm-factory",
        "UTM link factory",
        created > 0 ? "done" : "failed",
        created > 0
          ? `Created ${created}/${presets.length} tracked campaign URLs`
          : "Could not create UTM links",
        { copyText: urls.join("\n") },
      ),
    );
  }

  // ── 4. Referral mint ──────────────────────────────────────────────────────
  if (includeReferral) {
    try {
      const referral = await createReferral({
        referrerId: "orbit-do-it-all",
        referrerEmail: opts.referrerEmail?.trim() || "admin@zzaizzai.com",
        siteUrl: getSiteUrl(),
        rewardType: "credit",
        rewardAmount: 10,
      });
      steps.push(
        step(
          "acq-referral",
          "Referral / viral link",
          "done",
          `Minted ${referral.referralCode}`,
          { copyText: referral.referralLink, url: "/marketing-hub/referrals" },
        ),
      );
    } catch (e) {
      steps.push(
        step(
          "acq-referral",
          "Referral / viral link",
          "failed",
          e instanceof Error ? e.message : "Referral mint failed",
        ),
      );
    }
  }

  // ── 5. Content amplify (distribution pack) ────────────────────────────────
  if (includeAmplify) {
    try {
      const source = opts.amplifySource?.trim() || DEFAULT_AMPLIFY;
      const { outputs } = await amplifyForAcquisition(source, [
        "twitter",
        "linkedin",
        "reddit",
        "email",
      ]);
      const okCount = outputs.filter((o) => o.status === "done" || o.status === "prepared").length;
      steps.push(
        step(
          "acq-amplify",
          "Multi-channel amplify",
          okCount > 0 ? "done" : "failed",
          `Pack ready for ${okCount} channels`,
          {
            copyText: outputs.map((o) => `── ${o.channel} ──\n${o.content}`).join("\n\n"),
            url: "/marketing-hub/amplify",
          },
        ),
      );
    } catch (e) {
      steps.push(
        step(
          "acq-amplify",
          "Multi-channel amplify",
          "failed",
          e instanceof Error ? e.message : "Amplify failed",
        ),
      );
    }
  }

  // ── 6. Seed campaigns for critical/high playbooks ─────────────────────────
  if (includeCampaigns) {
    const day = new Date().toISOString().slice(0, 10);
    let seeded = 0;
    for (const pb of ACQUISITION_PLAYBOOKS.filter(
      (p) => p.impact === "critical" || p.impact === "high",
    )) {
      try {
        await createCampaign({
          name: `${pb.title} — ${day}`,
          description: pb.summary,
          channel:
            pb.channel === "paid"
              ? "paid"
              : pb.channel === "referral"
                ? "referral"
                : pb.channel === "email"
                  ? "email"
                  : pb.channel === "community" || pb.channel === "content_amp"
                    ? "social"
                    : "seo",
          tags: ["orbit", "do-it-all", pb.id],
          goals: { clicks: 500, leads: 50, conversions: 10 },
        });
        seeded++;
      } catch {
        /* continue */
      }
    }
    steps.push(
      step(
        "acq-campaigns",
        "Acquisition campaigns",
        seeded > 0 ? "done" : "failed",
        seeded > 0
          ? `Seeded ${seeded} campaign records for critical/high playbooks`
          : "Campaign seed failed",
        { url: "/marketing-hub/campaigns" },
      ),
    );
  }

  // ── 7. Growth Intelligence demand scan ────────────────────────────────────
  if (includeGrowthIntel) {
    try {
      const report = buildGrowthIntelligenceReport();
      const summary = formatGrowthIntelSummary(report);
      try {
        await db.insert(growthTasks).values({
          taskType: "growth_intelligence_daily",
          product: "orbit",
          status: "completed",
          details: { report, summary, source: "do_it_all" },
        });
      } catch {
        /* persist optional */
      }
      steps.push(
        step(
          "acq-growth-intel",
          "Demand / Growth Intel scan",
          "done",
          `${report.stats.aboveThreshold} opportunities ≥80 · ${report.stats.p0Count} P0`,
          { url: "/dashboard/orbit?tab=growth", copyText: summary },
        ),
      );
    } catch (e) {
      steps.push(
        step(
          "acq-growth-intel",
          "Demand / Growth Intel scan",
          "failed",
          e instanceof Error ? e.message : "Growth intel failed",
        ),
      );
    }
  }

  // ── 8. Channel intel tick ─────────────────────────────────────────────────
  if (includeChannelIntel) {
    try {
      const result = await runDueChannelIntelWatches();
      steps.push(
        step(
          "acq-channel-intel",
          "YouTube channel intel",
          "done",
          `Ran ${result.ran ?? 0} · skipped ${result.skipped ?? 0}`,
          { url: "/dashboard/marketing/channel-intel" },
        ),
      );
    } catch (e) {
      steps.push(
        step(
          "acq-channel-intel",
          "YouTube channel intel",
          "failed",
          e instanceof Error ? e.message : "Channel intel failed",
        ),
      );
    }
  }

  const finishedAt = new Date().toISOString();
  const stats = statsFrom(steps);
  const summary = [
    "═══ Customer Acquisition Do-It-All ═══",
    `v${CUSTOMER_ACQUISITION_VERSION} · ${stats.done} done · ${stats.prepared} prepared · ${stats.failed} failed · ${stats.skipped} skipped`,
    trafficMeta
      ? `Traffic: ${trafficMeta.onSitePages}+ pages · IndexNow ${trafficMeta.indexNowOk ? "✓" : "…"} · GSC ${trafficMeta.googleSitemapOk ? "✓" : "…"}`
      : "Traffic: nested (urrthang already blasted SEO)",
    "",
    ...steps.map((s) => {
      const icon =
        s.status === "done" ? "✓" : s.status === "failed" ? "✗" : s.status === "prepared" ? "◇" : "–";
      return `${icon} ${s.label}: ${s.message}`;
    }),
  ].join("\n");

  try {
    await db.insert(growthTasks).values({
      taskType: "customer_acquisition_do_it_all",
      product: "orbit",
      status: stats.failed === 0 ? "completed" : "failed",
      details: { version: CUSTOMER_ACQUISITION_VERSION, steps, stats, traffic: trafficMeta },
    });
  } catch {
    /* optional audit log */
  }

  return {
    ok: stats.failed === 0,
    version: CUSTOMER_ACQUISITION_VERSION,
    startedAt,
    finishedAt,
    steps,
    summary,
    stats,
    traffic: trafficMeta,
  };
}
