import { NextRequest } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { forbidden, ok, badRequest, serverError } from "@/lib/http-response";
import { getSiteUrl } from "@/lib/site-url";
import { getInternalAppOrigin } from "@/lib/internal-app-origin";
import {
  ACQUISITION_PLAYBOOKS,
  ACQUISITION_QUICK_ACTIONS,
  CUSTOMER_ACQUISITION_VERSION,
  defaultAcquisitionUtmPresets,
  getAcquisitionPlaybook,
  hybridStrategiesForAcquisition,
} from "@/lib/orbit/customer-acquisition";
import { getCampaignSummary, createCampaign } from "@/lib/marketing/campaigns";
import { getLeadStats } from "@/lib/marketing/leads";
import { getReferralStats, createReferral } from "@/lib/marketing/referrals";
import { createUtmLink, buildUtmUrl, getUtmLinks } from "@/lib/marketing/utm";
import { db } from "@/lib/db";
import { marketingAmplifyJobs } from "@/lib/marketing/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function loadDashboard() {
  const [campaigns, leads, referrals, utmLinks] = await Promise.all([
    getCampaignSummary().catch(() => null),
    getLeadStats().catch(() => null),
    getReferralStats().catch(() => null),
    getUtmLinks().catch(() => []),
  ]);

  const utmClicks = (utmLinks ?? []).reduce((s, l) => s + (l.clicks ?? 0), 0);

  return {
    version: CUSTOMER_ACQUISITION_VERSION,
    siteUrl: getSiteUrl(),
    kpis: {
      activeCampaigns: campaigns?.active ?? 0,
      totalCampaigns: campaigns?.total ?? 0,
      totalLeads: leads?.total ?? 0,
      newLeads: leads?.new ?? 0,
      convertedLeads: leads?.converted ?? 0,
      referralClicks: referrals?.totalClicks ?? 0,
      referralSignups: referrals?.totalSignups ?? 0,
      referralConversionRate: referrals?.conversionRate ?? "0",
      utmLinks: utmLinks?.length ?? 0,
      utmClicks,
    },
    playbooks: ACQUISITION_PLAYBOOKS,
    quickActions: ACQUISITION_QUICK_ACTIONS,
    utmPresets: defaultAcquisitionUtmPresets(),
    hybrid: hybridStrategiesForAcquisition(),
    recentUtm: (utmLinks ?? []).slice(0, 8).map((l) => ({
      id: l.id,
      name: l.name,
      clicks: l.clicks ?? 0,
      utmSource: l.utmSource,
      utmCampaign: l.utmCampaign,
      destinationUrl: l.destinationUrl,
    })),
  };
}

export async function GET(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) return forbidden();
  try {
    return ok(await loadDashboard());
  } catch (e) {
    return serverError(String(e));
  }
}

type ActionBody = {
  action?: string;
  playbookId?: string;
  skipTrafficBlast?: boolean;
  utm?: {
    name?: string;
    destinationUrl?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
  };
  referral?: {
    referrerId?: string;
    referrerEmail?: string;
    rewardType?: string;
    rewardAmount?: number;
  };
  amplify?: {
    sourceContent?: string;
    channels?: string[];
  };
  campaign?: {
    name?: string;
    channel?: string;
    description?: string;
    budget?: number;
  };
};

async function forwardInternal(
  path: string,
  init: RequestInit & { method?: string } = {},
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const origin = getInternalAppOrigin();
  const secret = process.env.ORBIT_INTERNAL_SECRET || "";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (secret) headers["x-internal-secret"] = secret;

  const res = await fetch(`${origin}${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(280_000),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function amplifyContent(sourceContent: string, channels: string[]) {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? "https://api.openai.com/v1";

  const CHANNEL_PROMPTS: Record<string, string> = {
    twitter:
      "Rewrite as a punchy Twitter/X thread (5-7 tweets). Hook first. End with a CTA linking to ZZAI.",
    linkedin:
      "Rewrite as a professional LinkedIn post. Insight first, short paragraphs, clear CTA.",
    email: "Rewrite as a marketing email with Subject, preview, body, and CTA button label.",
    reddit:
      "Rewrite as a genuine builder Reddit post (no hype). Include a soft mention of the free tool.",
  };

  const outputs: Array<{ channel: string; content: string; status: string }> = [];

  for (const channel of channels) {
    const prompt = CHANNEL_PROMPTS[channel] ?? "Rewrite this for marketing distribution.";
    if (!apiKey) {
      outputs.push({
        channel,
        content: `[Draft for ${channel}]\n\n${sourceContent.slice(0, 1200)}\n\n— Try ZZAI: ${getSiteUrl()}`,
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
      outputs.push({ channel, content: "", status: "failed" });
    }
  }

  const [job] = await db
    .insert(marketingAmplifyJobs)
    .values({
      sourceContent,
      sourceType: "orbit_acquisition",
      channels,
      outputs,
      status: "done",
    })
    .returning();

  return job;
}

export async function POST(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) return forbidden();

  let body: ActionBody;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const action = body.action?.trim();
  if (!action) return badRequest("action is required");

  try {
    switch (action) {
      case "dashboard":
        return ok(await loadDashboard());

      /** Strongest one-button: full urrthang marketing autopilot (SEO traffic + acquisition layer) */
      case "do_it_all":
      case "urrthang": {
        const { ensureOrbitAiForRun } = await import("@/lib/orbit/ensure-orbit-ai");
        await ensureOrbitAiForRun().catch(() => null);
        const { runMarketingAutopilot } = await import("@/lib/orbit/marketing-autopilot");
        const result = await runMarketingAutopilot({ skipOnSite: !!body.skipTrafficBlast });
        return ok({
          action: "do_it_all",
          ok: result.ok,
          result,
          message: result.ok
            ? `Do-it-all complete — ${result.stats.done} done · ${result.stats.prepared} prepared · acquisition + SEO traffic automated`
            : `Do-it-all finished with issues — ${result.stats.failed} failed · check log`,
          summary: result.summary,
        });
      }

      /** Acquisition layer only (optional traffic blast) — lighter than full urrthang */
      case "run_all":
      case "run_acquisition": {
        const { runCustomerAcquisitionAutomation } =
          await import("@/lib/orbit/customer-acquisition-automation");
        const result = await runCustomerAcquisitionAutomation({
          skipTrafficBlast: !!body.skipTrafficBlast,
          includeTrafficBlast: !body.skipTrafficBlast,
          referrerEmail: body.referral?.referrerEmail,
          amplifySource: body.amplify?.sourceContent,
        });
        return ok({
          action: "run_all",
          ok: result.ok,
          result,
          message: result.ok
            ? `Acquisition automation complete — ${result.stats.done} steps done`
            : `Acquisition automation finished with ${result.stats.failed} failures`,
          summary: result.summary,
        });
      }

      case "traffic_blast": {
        const result = await forwardInternal("/api/orbit/full-traffic-automation", {
          method: "POST",
        });
        return ok({
          action,
          ok: result.ok,
          result: result.data,
          message: result.ok
            ? "Traffic blast complete — on-site content + search engines notified"
            : `Traffic blast failed (${result.status})`,
        });
      }

      case "weekly_growth": {
        const result = await forwardInternal("/api/growth/tasks", { method: "POST" });
        return ok({
          action,
          ok: result.ok,
          result: result.data,
          message: result.ok ? "Weekly growth tasks finished" : "Weekly growth tasks failed",
        });
      }

      case "growth_intel": {
        const result = await forwardInternal("/api/orbit/growth-intelligence", {
          method: "POST",
        });
        return ok({
          action,
          ok: result.ok,
          result: result.data,
          message: result.ok ? "Growth Intelligence refreshed" : "Demand scan failed",
        });
      }

      case "channel_intel": {
        const result = await forwardInternal("/api/marketing/channel-intel/tick", {
          method: "POST",
        });
        return ok({
          action,
          ok: result.ok,
          result: result.data,
          message: result.ok ? "Channel intel tick complete" : "Channel intel tick failed",
        });
      }

      case "create_utm": {
        const utm = body.utm;
        if (
          !utm?.name ||
          !utm.destinationUrl ||
          !utm.utmSource ||
          !utm.utmMedium ||
          !utm.utmCampaign
        ) {
          return badRequest(
            "utm.name, destinationUrl, utmSource, utmMedium, utmCampaign are required",
          );
        }
        const link = await createUtmLink({
          name: utm.name,
          destinationUrl: utm.destinationUrl,
          utmSource: utm.utmSource,
          utmMedium: utm.utmMedium,
          utmCampaign: utm.utmCampaign,
          utmTerm: utm.utmTerm,
          utmContent: utm.utmContent,
        });
        const fullUrl = buildUtmUrl({
          destinationUrl: utm.destinationUrl,
          utmSource: utm.utmSource,
          utmMedium: utm.utmMedium,
          utmCampaign: utm.utmCampaign,
          utmTerm: utm.utmTerm,
          utmContent: utm.utmContent,
        });
        return ok({
          action,
          ok: true,
          link: { ...link, fullUrl },
          message: `UTM created: ${utm.name}`,
        });
      }

      case "create_referral": {
        const ref = body.referral;
        const email = ref?.referrerEmail?.trim() || "admin@zzaizzai.com";
        const referrerId = ref?.referrerId?.trim() || "orbit-admin";
        const referral = await createReferral({
          referrerId,
          referrerEmail: email,
          siteUrl: getSiteUrl(),
          rewardType: ref?.rewardType ?? "credit",
          rewardAmount: ref?.rewardAmount ?? 10,
        });
        return ok({
          action,
          ok: true,
          referral,
          message: `Referral link ready: ${referral.referralCode}`,
        });
      }

      case "amplify": {
        const content = body.amplify?.sourceContent?.trim();
        if (!content) return badRequest("amplify.sourceContent is required");
        const channels = body.amplify?.channels?.length
          ? body.amplify.channels
          : ["twitter", "linkedin", "reddit", "email"];
        const job = await amplifyContent(content, channels);
        return ok({
          action,
          ok: true,
          job,
          message: `Amplified to ${channels.length} channels`,
        });
      }

      case "seed_campaign": {
        const name =
          body.campaign?.name?.trim() ||
          `Orbit acquisition ${new Date().toISOString().slice(0, 10)}`;
        const campaign = await createCampaign({
          name,
          description:
            body.campaign?.description ??
            "Seeded from Admin Orbit Customer Acquisition — track spend and conversions.",
          channel: body.campaign?.channel ?? "seo",
          budget: body.campaign?.budget ?? 0,
          goals: { clicks: 500, leads: 50, conversions: 10 },
          tags: ["orbit", "acquisition"],
        });
        return ok({
          action,
          ok: true,
          campaign,
          message: `Campaign created: ${campaign.name}`,
        });
      }

      case "run_playbook": {
        const playbook = body.playbookId ? getAcquisitionPlaybook(body.playbookId) : undefined;
        if (!playbook) return badRequest("Unknown playbookId");

        const steps: { action: string; ok: boolean; message: string }[] = [];

        // Execute the first runnable automation actions for this playbook
        for (const a of playbook.actions) {
          if (a === "traffic_blast") {
            const r = await forwardInternal("/api/orbit/full-traffic-automation", {
              method: "POST",
            });
            steps.push({
              action: a,
              ok: r.ok,
              message: r.ok ? "Traffic blast done" : "Traffic blast failed",
            });
          } else if (a === "weekly_growth") {
            const r = await forwardInternal("/api/growth/tasks", { method: "POST" });
            steps.push({
              action: a,
              ok: r.ok,
              message: r.ok ? "Growth tasks done" : "Growth tasks failed",
            });
          } else if (a === "growth_intel") {
            const r = await forwardInternal("/api/orbit/growth-intelligence", {
              method: "POST",
            });
            steps.push({
              action: a,
              ok: r.ok,
              message: r.ok ? "Demand scan done" : "Demand scan failed",
            });
          } else if (a === "channel_intel") {
            const r = await forwardInternal("/api/marketing/channel-intel/tick", {
              method: "POST",
            });
            steps.push({
              action: a,
              ok: r.ok,
              message: r.ok ? "Channel intel done" : "Channel intel failed",
            });
          } else if (a === "seed_campaign") {
            const campaign = await createCampaign({
              name: `${playbook.title} — ${new Date().toISOString().slice(0, 10)}`,
              description: playbook.summary,
              channel:
                playbook.channel === "paid"
                  ? "paid"
                  : playbook.channel === "referral"
                    ? "referral"
                    : playbook.channel === "email"
                      ? "email"
                      : playbook.channel === "community" || playbook.channel === "content_amp"
                        ? "social"
                        : "seo",
              tags: ["orbit", "playbook", playbook.id],
              goals: { clicks: 500, leads: 50, conversions: 10 },
            });
            steps.push({
              action: a,
              ok: true,
              message: `Campaign ${campaign.id} created`,
            });
          } else if (a === "create_utm") {
            const preset = defaultAcquisitionUtmPresets()[0];
            const link = await createUtmLink({ ...preset });
            const fullUrl = buildUtmUrl({ ...preset });
            steps.push({
              action: a,
              ok: true,
              message: `UTM ${link.name}: ${fullUrl.slice(0, 80)}…`,
            });
          } else {
            steps.push({
              action: a,
              ok: true,
              message: `Manual / hub step — see playbook links for ${a}`,
            });
          }
        }

        return ok({
          action,
          ok: steps.every((s) => s.ok),
          playbook: { id: playbook.id, title: playbook.title },
          steps,
          message: `Playbook “${playbook.title}” executed (${steps.filter((s) => s.ok).length}/${steps.length} ok)`,
        });
      }

      default:
        return badRequest(`Unknown action: ${action}`);
    }
  } catch (e) {
    return serverError(String(e));
  }
}
