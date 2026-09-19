"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Rocket,
  Loader2,
  RefreshCw,
  Link2,
  Gift,
  Megaphone,
  Target,
  Zap,
  ExternalLink,
  Copy,
  CheckCircle2,
  TrendingUp,
  Users,
  MousePointerClick,
  Sparkles,
  Play,
  BarChart3,
} from "lucide-react";
import type {
  AcquisitionPlaybook,
  AcquisitionQuickAction,
} from "@/lib/orbit/customer-acquisition";
import {
  acquisitionChannelLabel,
  CUSTOMER_ACQUISITION_VERSION,
} from "@/lib/orbit/customer-acquisition";
import {
  PINK_CAMO_BUTTON_ACTIVE_STYLE,
  PINK_CAMO_BUTTON_CLASS,
  PINK_CAMO_BUTTON_STYLE,
  URRTHANG_LABEL,
} from "@/lib/ui-pink-camo-button";
import { OrbitHybridGrowthPanel } from "@/components/orbit-hybrid-growth-panel";

const TEAL = "#5B8DA8";
const BURG = "#6B2C4E";

type Kpis = {
  activeCampaigns: number;
  totalCampaigns: number;
  totalLeads: number;
  newLeads: number;
  convertedLeads: number;
  referralClicks: number;
  referralSignups: number;
  referralConversionRate: string;
  utmLinks: number;
  utmClicks: number;
};

type UtmPreset = {
  name: string;
  destinationUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
};

type Dashboard = {
  version: string;
  siteUrl: string;
  kpis: Kpis;
  playbooks: AcquisitionPlaybook[];
  quickActions: AcquisitionQuickAction[];
  utmPresets: UtmPreset[];
  recentUtm: Array<{
    id: string;
    name: string;
    clicks: number;
    utmSource: string;
    utmCampaign: string;
    destinationUrl: string;
  }>;
};

const IMPACT_STYLE: Record<string, string> = {
  critical: "bg-red-500/15 text-red-700 border-red-500/30",
  high: "bg-amber-500/15 text-amber-800 border-amber-500/30",
  medium: "bg-sky-500/15 text-sky-800 border-sky-500/30",
};

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/90 px-3 py-2.5 flex items-center gap-2.5">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${TEAL}18`, border: `1px solid ${TEAL}33` }}
      >
        <Icon className="w-4 h-4" style={{ color: TEAL }} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-black text-foreground leading-none truncate">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/80">{sub}</p>}
      </div>
    </div>
  );
}

export function OrbitCustomerAcquisition() {
  const { toast } = useToast();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [lastLog, setLastLog] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [amplifyText, setAmplifyText] = useState(
    "ZZAI ships free AI tools and security mini-apps so founders can go from idea to live product without a $500/hr agency. Try the Tools Hub, then open Seeds to build.",
  );
  const [referralEmail, setReferralEmail] = useState("admin@zzaizzai.com");
  const [amplifyOutputs, setAmplifyOutputs] = useState<
    Array<{ channel: string; content: string; status: string }>
  >([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/orbit/customer-acquisition");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
    } catch (e) {
      toast({
        title: "Acquisition dashboard failed",
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (
    action: string,
    payload: Record<string, unknown> = {},
  ): Promise<Record<string, unknown> | null> => {
    setBusy(action);
    setLastLog(null);
    try {
      const res = await authFetch("/api/orbit/customer-acquisition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      const msg = typeof json.message === "string" ? json.message : `${action} complete`;
      setLastLog(
        typeof json.summary === "string"
          ? json.summary
          : typeof json.result?.summary === "string"
            ? json.result.summary
            : json.steps
              ? (json.steps as Array<{ message: string }>).map((s) => s.message).join("\n")
              : msg,
      );
      toast({ title: msg, duration: 8000 });
      if (action === "amplify" && json.job?.outputs) {
        setAmplifyOutputs(json.job.outputs);
      }
      if (
        action === "create_utm" ||
        action === "create_referral" ||
        action === "seed_campaign" ||
        action === "run_playbook" ||
        action === "do_it_all" ||
        action === "run_all"
      ) {
        await load();
      }
      return json;
    } catch (e) {
      setLastLog(String(e));
      toast({ title: "Action failed", description: String(e), variant: "destructive" });
      return null;
    } finally {
      setBusy(null);
    }
  };

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  if (loading && !data) {
    return (
      <div
        className="rounded-2xl border-2 border-[#5B8DA8]/30 bg-[#5B8DA8]/5 p-8 flex flex-col items-center gap-3"
        data-testid="acquisition-loading"
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: TEAL }} />
        <p className="text-sm text-muted-foreground">Loading Customer Acquisition…</p>
      </div>
    );
  }

  if (!data) return null;

  const { kpis } = data;

  return (
    <div className="space-y-4" data-testid="orbit-customer-acquisition">
      {/* Header */}
      <div
        className="rounded-2xl border-2 p-4 space-y-3"
        style={{
          borderColor: `${TEAL}55`,
          background: `linear-gradient(135deg, ${TEAL}14, ${BURG}10)`,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${TEAL}25`, border: `2px solid ${TEAL}40` }}
            >
              <Megaphone className="w-6 h-6" style={{ color: TEAL }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-foreground">
                  Customer Acquisition Command
                </h2>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: "#16a34a" }}
                >
                  LIVE v{data.version || CUSTOMER_ACQUISITION_VERSION}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                State-of-the-art acquisition for {data.siteUrl.replace(/^https?:\/\//, "")}: traffic
                blast, UTM attribution, referrals, content amplify, and ranked playbooks that ship
                real visits — not just checklists.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => void load()}
            disabled={!!busy}
            variant="outline"
            className="font-bold shrink-0"
            data-testid="button-acquisition-refresh"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh KPIs
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <KpiCard
            label="Active campaigns"
            value={kpis.activeCampaigns}
            sub={`${kpis.totalCampaigns} total`}
            icon={Target}
          />
          <KpiCard
            label="Leads"
            value={kpis.totalLeads}
            sub={`${kpis.newLeads} new · ${kpis.convertedLeads} converted`}
            icon={Users}
          />
          <KpiCard
            label="Referral clicks"
            value={kpis.referralClicks}
            sub={`${kpis.referralSignups} signups · ${kpis.referralConversionRate}%`}
            icon={Gift}
          />
          <KpiCard
            label="UTM links"
            value={kpis.utmLinks}
            sub={`${kpis.utmClicks} tracked clicks`}
            icon={MousePointerClick}
          />
          <KpiCard label="Playbooks" value={data.playbooks.length} icon={BarChart3} />
        </div>

        {/* Do it all — strongest automation */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void runAction("do_it_all")}
            className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-base ${PINK_CAMO_BUTTON_CLASS}`}
            style={busy === "do_it_all" ? PINK_CAMO_BUTTON_ACTIVE_STYLE : PINK_CAMO_BUTTON_STYLE}
            data-testid="acquisition-do-it-all"
          >
            {busy === "do_it_all" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Rocket className="w-5 h-5" />
            )}
            {busy === "do_it_all"
              ? "Running full SEO + acquisition automation…"
              : `Do it all — ${URRTHANG_LABEL} SEO traffic + acquisition`}
          </button>
          <p className="text-[11px] text-muted-foreground leading-snug text-center">
            One button runs the full Orbit engine: SEO pages, IndexNow/Google/Bing, Growth Intel,
            UTMs, referrals, content amplify, campaigns, channel intel, and social packs.
          </p>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void runAction("run_all")}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border-2 border-border bg-card hover:bg-muted/40 disabled:opacity-60"
            data-testid="acquisition-run-all-layer"
          >
            {busy === "run_all" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" style={{ color: TEAL }} />
            )}
            Acquisition layer only (traffic blast + UTMs + referrals + amplify)
          </button>
        </div>
      </div>

      {/* One-click traffic actions */}
      <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
        <div
          className="px-4 py-2.5 flex items-center gap-2 border-b border-border"
          style={{ background: `${BURG}08` }}
        >
          <Zap className="w-4 h-4" style={{ color: BURG }} />
          <h3 className="text-sm font-black">Gain traffic now</h3>
        </div>
        <div className="p-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {(
            [
              {
                id: "traffic_blast",
                label: "Traffic blast",
                desc: "Publish SEO + notify search engines",
                icon: Rocket,
              },
              {
                id: "weekly_growth",
                label: "Weekly growth",
                desc: "Sitemap pings + IndexNow",
                icon: TrendingUp,
              },
              {
                id: "growth_intel",
                label: "Demand scan",
                desc: "Opportunities scoring ≥80",
                icon: Target,
              },
              {
                id: "channel_intel",
                label: "Channel intel",
                desc: "YouTube watch tick",
                icon: Sparkles,
              },
            ] as const
          ).map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={!!busy}
              onClick={() => void runAction(a.id)}
              className="rounded-xl border-2 border-border bg-background hover:bg-muted/40 px-3 py-3 text-left transition-all disabled:opacity-60"
              data-testid={`acquisition-action-${a.id}`}
            >
              <div className="flex items-center gap-2 mb-1">
                {busy === a.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: TEAL }} />
                ) : (
                  <a.icon className="w-4 h-4" style={{ color: TEAL }} />
                )}
                <span className="text-xs font-bold">{a.label}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">{a.desc}</p>
            </button>
          ))}
        </div>
        <div className="px-3 pb-3">
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void runAction("seed_campaign")}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-black text-white disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${TEAL}, ${BURG})` }}
            data-testid="acquisition-seed-campaign"
          >
            {busy === "seed_campaign" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Seed acquisition campaign record
          </button>
        </div>
      </div>

      {/* UTM + Referral tools */}
      <div className="grid lg:grid-cols-2 gap-3">
        <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
          <div className="px-4 py-2.5 flex items-center gap-2 border-b border-border bg-muted/30">
            <Link2 className="w-4 h-4" style={{ color: TEAL }} />
            <h3 className="text-sm font-black">UTM link factory</h3>
            <Link
              href="/marketing-hub/utm"
              className="ml-auto text-[10px] font-semibold flex items-center gap-1 hover:underline"
              style={{ color: TEAL }}
            >
              Full builder <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-3 space-y-2">
            {data.utmPresets.map((preset) => (
              <div
                key={preset.name}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{preset.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {preset.utmSource} · {preset.utmCampaign}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] font-bold shrink-0"
                  disabled={!!busy}
                  onClick={async () => {
                    const json = await runAction("create_utm", { utm: preset });
                    const fullUrl = (json?.link as { fullUrl?: string } | undefined)?.fullUrl;
                    if (fullUrl) void copyText(fullUrl, preset.name);
                  }}
                  data-testid={`utm-preset-${preset.utmCampaign}`}
                >
                  {busy === "create_utm" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : copied === preset.name ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" /> Create
                    </>
                  )}
                </Button>
              </div>
            ))}
            {data.recentUtm.length > 0 && (
              <div className="pt-2 border-t border-border space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Recent
                </p>
                {data.recentUtm.slice(0, 4).map((u) => (
                  <p key={u.id} className="text-[11px] text-muted-foreground truncate">
                    {u.name} · {u.clicks} clicks · {u.utmSource}/{u.utmCampaign}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
          <div className="px-4 py-2.5 flex items-center gap-2 border-b border-border bg-muted/30">
            <Gift className="w-4 h-4" style={{ color: BURG }} />
            <h3 className="text-sm font-black">Referral mint</h3>
            <Link
              href="/marketing-hub/referrals"
              className="ml-auto text-[10px] font-semibold flex items-center gap-1 hover:underline"
              style={{ color: BURG }}
            >
              Hub <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-3 space-y-3">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Mint a tracked invite link. Share on Seeds, Security, and social — clicks and signups
              attribute back here.
            </p>
            <Input
              value={referralEmail}
              onChange={(e) => setReferralEmail(e.target.value)}
              placeholder="referrer@email.com"
              className="h-9 text-xs"
              data-testid="acquisition-referral-email"
            />
            <Button
              type="button"
              className="w-full font-bold"
              style={{ background: BURG }}
              disabled={!!busy}
              onClick={async () => {
                const json = await runAction("create_referral", {
                  referral: {
                    referrerEmail: referralEmail,
                    referrerId: "orbit-admin",
                  },
                });
                const link = (json?.referral as { referralLink?: string } | undefined)
                  ?.referralLink;
                if (link) void copyText(link, "referral");
              }}
              data-testid="acquisition-mint-referral"
            >
              {busy === "create_referral" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : copied === "referral" ? (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              ) : (
                <Gift className="w-4 h-4 mr-2" />
              )}
              {copied === "referral" ? "Link copied" : "Mint & copy referral link"}
            </Button>
          </div>
        </div>
      </div>

      {/* Content amplify */}
      <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
        <div className="px-4 py-2.5 flex items-center gap-2 border-b border-border bg-muted/30">
          <Sparkles className="w-4 h-4" style={{ color: TEAL }} />
          <h3 className="text-sm font-black">Content amplifier</h3>
          <span className="text-[10px] text-muted-foreground">
            Twitter · LinkedIn · Reddit · Email
          </span>
        </div>
        <div className="p-3 space-y-3">
          <Textarea
            value={amplifyText}
            onChange={(e) => setAmplifyText(e.target.value)}
            rows={4}
            className="text-xs"
            data-testid="acquisition-amplify-input"
          />
          <Button
            type="button"
            className="font-bold"
            style={{ background: TEAL }}
            disabled={!!busy || !amplifyText.trim()}
            onClick={() =>
              void runAction("amplify", {
                amplify: {
                  sourceContent: amplifyText,
                  channels: ["twitter", "linkedin", "reddit", "email"],
                },
              })
            }
            data-testid="acquisition-amplify-run"
          >
            {busy === "amplify" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Megaphone className="w-4 h-4 mr-2" />
            )}
            Amplify across channels
          </Button>
          {amplifyOutputs.length > 0 && (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {amplifyOutputs.map((o) => (
                <div
                  key={o.channel}
                  className="rounded-lg border border-border bg-background p-2.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold capitalize">{o.channel}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px]"
                      onClick={() => void copyText(o.content, o.channel)}
                    >
                      {copied === o.channel ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
                    {o.content || `(${o.status})`}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Playbooks */}
      <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
        <div
          className="px-4 py-2.5 flex items-center gap-2 border-b border-border"
          style={{ background: `${TEAL}08` }}
        >
          <Target className="w-4 h-4" style={{ color: TEAL }} />
          <h3 className="text-sm font-black">Acquisition playbooks</h3>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {data.playbooks.length}
          </span>
        </div>
        <div className="p-3 grid md:grid-cols-2 gap-3">
          {data.playbooks.map((pb) => (
            <div
              key={pb.id}
              className="rounded-xl border border-border bg-background/80 p-3 space-y-2"
              data-testid={`acquisition-playbook-${pb.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold leading-snug">{pb.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {acquisitionChannelLabel(pb.channel)} · first visits in {pb.speed}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${IMPACT_STYLE[pb.impact]}`}
                >
                  {pb.impact}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{pb.summary}</p>
              <div className="flex flex-wrap gap-1">
                {pb.metrics.slice(0, 3).map((m) => (
                  <span
                    key={m}
                    className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground"
                  >
                    {m}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Button
                  type="button"
                  size="sm"
                  className="h-7 text-[10px] font-bold"
                  style={{ background: TEAL }}
                  disabled={!!busy}
                  onClick={() => void runAction("run_playbook", { playbookId: pb.id })}
                  data-testid={`run-playbook-${pb.id}`}
                >
                  {busy === "run_playbook" ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Play className="w-3 h-3 mr-1" />
                  )}
                  Run playbook
                </Button>
                {pb.hrefs.slice(0, 2).map((h) => (
                  <Link
                    key={h.href}
                    href={h.href}
                    className="inline-flex items-center h-7 px-2 rounded-md border border-border text-[10px] font-semibold hover:bg-muted/50"
                  >
                    {h.label}
                    <ExternalLink className="w-2.5 h-2.5 ml-1 opacity-60" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <OrbitHybridGrowthPanel />

      {/* Hub shortcuts */}
      <div className="rounded-xl border border-dashed border-border px-3 py-3 flex flex-wrap gap-2 text-xs">
        {[
          { href: "/marketing-hub", label: "Marketing Hub" },
          { href: "/marketing-hub/campaigns", label: "Campaigns" },
          { href: "/marketing-hub/leads", label: "Leads" },
          { href: "/marketing-hub/ab-tests", label: "A/B tests" },
          { href: "/dashboard/growth", label: "Growth engine" },
          { href: "/dashboard/traffic", label: "Traffic" },
          { href: "/dashboard/orbit?tab=autopilot", label: "Autopilot" },
          { href: "/dashboard/orbit?tab=growth", label: "Growth Intel" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/40 font-semibold"
          >
            {l.label}
            <ExternalLink className="w-3 h-3 opacity-50" />
          </Link>
        ))}
      </div>

      {lastLog && (
        <pre
          className="rounded-xl border border-border bg-muted/20 p-3 text-[11px] text-muted-foreground whitespace-pre-wrap max-h-56 overflow-y-auto font-mono"
          data-testid="acquisition-last-log"
        >
          {lastLog}
        </pre>
      )}
    </div>
  );
}
