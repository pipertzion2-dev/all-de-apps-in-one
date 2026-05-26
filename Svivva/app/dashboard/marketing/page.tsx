"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authFetch } from "@/hooks/use-auth";
import {
  Sparkles,
  Bot,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  Globe,
  FileText,
  Package,
  Star,
  ArrowRight,
  RefreshCw,
  Copy,
  Twitter,
  Linkedin,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertCircle,
  Shield,
  Zap,
  Rocket,
  Activity,
  Link2,
  Play,
} from "lucide-react";

import { getSuggestedGoDaddyDomain } from "@/lib/site-url-public";

const PINK = "#E91E8C";
const TEAL = "#5BA8A0";
const ORANGE = "#FF5C00";
const GREEN = "#16a34a";
const BLUE = "#1a73e8";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Infra {
  domain: { hasGodaddyCreds: boolean; domain: string | null };
  google: { analyticsId: string | null; siteUrl: string | null; sitemapUrl: string };
  content: {
    totalSitemapUrls: number;
    toolPages: number;
    rootSeoPages: number;
    seedMarketingPages: number;
    blogPosts: number;
  };
}
interface GSearch {
  indexnow: { key: string | null; lastSubmit: string | null; urlCount: number };
  google: { hasServiceAccount: boolean; lastIndexing: string | null };
  totalUrls: number;
}
interface Creds {
  hasGodaddy: boolean;
  hasGoogle: boolean;
  godaddyDomain: string | null;
  googleSiteUrl: string | null;
  miniAppsUrl: string | null;
  miniAppsSubdomain: string | null;
}
interface PipelineLog {
  step: string;
  status: "ok" | "skip" | "error";
  detail: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1 text-xs hover:underline font-medium flex-shrink-0"
      style={{ color: PINK }}
    >
      <Copy className="w-3 h-3" />
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ── Connection Hub ─────────────────────────────────────────────────────────────
function ConnectionHub({ creds, onRefresh }: { creds: Creds | null; onRefresh: () => void }) {
  const [open, setOpen] = useState(!creds?.miniAppsUrl);
  const [saving, setSaving] = useState<string | null>(null);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<{
    summary: string;
    log: PipelineLog[];
    createdPages?: { slug: string; title: string }[];
  } | null>(null);

  // Mini apps URL (primary)
  const [miniAppsUrl, setMiniAppsUrl] = useState(creds?.miniAppsUrl || "");
  const [miniAppsSubdomain, setMiniAppsSubdomain] = useState(creds?.miniAppsSubdomain || "apps");

  // GoDaddy
  const [gdKey, setGdKey] = useState("");
  const [gdSecret, setGdSecret] = useState("");
  const [gdDomain, setGdDomain] = useState(creds?.godaddyDomain || "");

  // Google
  const [googleUrl, setGoogleUrl] = useState(creds?.googleSiteUrl || "");
  const [googlePinging, setGooglePinging] = useState(false);
  const [googlePingResult, setGooglePingResult] = useState<string | null>(null);

  useEffect(() => {
    if (creds?.miniAppsUrl !== undefined) setMiniAppsUrl(creds.miniAppsUrl || "");
  }, [creds?.miniAppsUrl]);
  useEffect(() => {
    if (creds?.miniAppsSubdomain !== undefined)
      setMiniAppsSubdomain(creds.miniAppsSubdomain || "apps");
  }, [creds?.miniAppsSubdomain]);
  useEffect(() => {
    if (creds?.godaddyDomain !== undefined) setGdDomain(creds.godaddyDomain || "");
  }, [creds?.godaddyDomain]);
  useEffect(() => {
    if (creds?.googleSiteUrl !== undefined) setGoogleUrl(creds.googleSiteUrl || "");
  }, [creds?.googleSiteUrl]);

  const save = async (fields: Record<string, string>, id: string) => {
    setSaving(id);
    try {
      await authFetch("/api/seeds/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      onRefresh();
    } finally {
      setSaving(null);
    }
  };

  const runPipeline = async () => {
    setPipelineRunning(true);
    setPipelineResult(null);
    try {
      const r = await authFetch("/api/marketing/auto-link", { method: "POST" });
      const d = await r.json();
      setPipelineResult(d);
      onRefresh();
    } finally {
      setPipelineRunning(false);
    }
  };

  const pingGoogle = async () => {
    const url = googleUrl || creds?.googleSiteUrl;
    if (!url) return;
    setGooglePinging(true);
    setGooglePingResult(null);
    try {
      // Real Webmasters v3 submission via /api/gsc/save (the legacy ?ping= endpoint
      // was retired June 2023; this hits the real GSC API using the saved service account).
      const r = await fetch("/api/gsc/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit_sitemap" }),
      });
      const body = await r.json().catch(() => ({}));
      if (body?.google?.ok) {
        setGooglePingResult(`✓ Submitted to Google Search Console: ${body.sitemapUrl}`);
      } else if (body?.google?.error?.includes("No service account")) {
        setGooglePingResult(
          "Add a service-account JSON at /dashboard/gsc-connect to enable Google submission.",
        );
      } else {
        setGooglePingResult(`Google submission failed: ${body?.google?.error || "Unknown error"}`);
      }
    } catch (e: any) {
      setGooglePingResult(`Request failed: ${e?.message || "Unknown error"}`);
    } finally {
      setGooglePinging(false);
    }
  };

  // Derived preview values
  const appDomain = miniAppsUrl
    ? (() => {
        try {
          return new URL(miniAppsUrl.startsWith("http") ? miniAppsUrl : `https://${miniAppsUrl}`)
            .hostname;
        } catch {
          return null;
        }
      })()
    : null;
  const cnameParts = {
    sub: (miniAppsSubdomain || "apps").replace(/[^a-z0-9-]/gi, "-").toLowerCase(),
    domain: creds?.godaddyDomain || gdDomain,
  };
  const cnamePreview =
    cnameParts.domain && appDomain ? `${cnameParts.sub}.${cnameParts.domain} → ${appDomain}` : null;
  const sitemapPreview =
    googleUrl || creds?.googleSiteUrl
      ? (googleUrl || creds?.googleSiteUrl || "").replace(/\/$/, "") + "/sitemap.xml"
      : null;

  const hasAnySetup = !!(creds?.miniAppsUrl || creds?.hasGodaddy || creds?.hasGoogle);

  return (
    <div className="rounded-2xl border border-border bg-white dark:bg-card shadow-sm overflow-hidden mb-3">
      {/* Summary bar */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
        data-testid="button-connection-hub-toggle"
      >
        <div className="flex items-center gap-3">
          <Link2 className="w-4 h-4 flex-shrink-0" style={{ color: PINK }} />
          <span className="text-sm font-semibold text-foreground">Traffic Setup</span>
          <div className="flex items-center gap-1">
            {[
              { label: "Mini Apps", ok: !!creds?.miniAppsUrl, color: ORANGE },
              { label: "GoDaddy", ok: creds?.hasGodaddy, color: GREEN },
              { label: "Google", ok: creds?.hasGoogle, color: BLUE },
            ].map(({ label, ok, color }) => (
              <div
                key={label}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ok ? "text-white" : "bg-muted/50 text-muted-foreground border border-border"}`}
                style={ok ? { background: color } : {}}
              >
                {ok ? (
                  <CheckCircle className="w-2.5 h-2.5" />
                ) : (
                  <AlertCircle className="w-2.5 h-2.5" />
                )}
                {label}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasAnySetup && !open && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                runPipeline();
              }}
              disabled={pipelineRunning}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${PINK}, #9c27b0)` }}
              data-testid="button-pipeline-quick"
            >
              {pipelineRunning ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              Run pipeline
            </button>
          )}
          {open ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Strategy overview */}
      {open && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
          {/* What this does */}
          <div className="rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 px-4 py-3 text-xs space-y-1">
            <p className="font-semibold text-foreground text-sm">Your strategy in 3 steps</p>
            <div className="flex items-start gap-2 text-muted-foreground mt-2">
              <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                1
              </span>
              <span>
                <strong className="text-foreground">Your mini apps URL</strong> → we generate an SEO
                landing page for every tool inside it, published at{" "}
                <strong>{creds?.googleSiteUrl || "svivva.com"}/tool-name</strong>
              </span>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                2
              </span>
              <span>
                <strong className="text-foreground">GoDaddy</strong> auto-creates a DNS CNAME record
                so visitors at{" "}
                <strong>{cnamePreview || `apps.yourdomain.com → your-apps-host.com`}</strong>
              </span>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                3
              </span>
              <span>
                <strong className="text-foreground">Google</strong> gets your sitemap pinged
                automatically so every new landing page gets indexed fast
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* ── Step 1: Mini Apps ── */}
            <div
              className={`rounded-xl p-3 border-2 text-xs space-y-2 ${creds?.miniAppsUrl ? "border-orange-300 bg-orange-50/60" : "border-dashed border-border bg-muted/20"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <span className="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  Your Mini Apps
                </div>
                {creds?.miniAppsUrl ? (
                  <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-2.5 h-2.5" />
                    Set
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Required</span>
                )}
              </div>

              {creds?.miniAppsUrl && (
                <div
                  className="bg-orange-100 rounded-lg px-2 py-1.5 font-mono text-orange-800 truncate"
                  title={creds.miniAppsUrl}
                >
                  {creds.miniAppsUrl}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-muted-foreground block">Mini apps URL</label>
                <input
                  value={miniAppsUrl}
                  onChange={(e) => setMiniAppsUrl(e.target.value)}
                  placeholder="https://apps.svivva.com"
                  className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-background focus:outline-none"
                  data-testid="input-mini-apps-url"
                />

                <label className="text-muted-foreground block">
                  Subdomain name{" "}
                  <span className="text-muted-foreground/60">(optional, default: apps)</span>
                </label>
                <input
                  value={miniAppsSubdomain}
                  onChange={(e) => setMiniAppsSubdomain(e.target.value)}
                  placeholder="apps"
                  className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-background focus:outline-none"
                  data-testid="input-mini-apps-subdomain"
                />

                {appDomain && cnameParts.domain && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-2 py-1.5 text-green-700 font-mono text-xs">
                    DNS preview: {cnameParts.sub}.{cnameParts.domain} → {appDomain}
                  </div>
                )}

                <button
                  onClick={() => save({ miniAppsUrl, miniAppsSubdomain }, "mini")}
                  disabled={!miniAppsUrl.trim() || saving === "mini"}
                  className="w-full py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition-all hover:opacity-90"
                  style={{ background: ORANGE }}
                  data-testid="button-save-mini-apps"
                >
                  {saving === "mini" ? (
                    <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                  ) : creds?.miniAppsUrl ? (
                    "Update Mini Apps URL"
                  ) : (
                    "Save Mini Apps URL"
                  )}
                </button>
              </div>
            </div>

            {/* ── Step 2: GoDaddy ── */}
            <div
              className={`rounded-xl p-3 border-2 text-xs space-y-2 ${creds?.hasGodaddy ? "border-green-300 bg-green-50/60" : "border-dashed border-border bg-muted/20"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <span className="w-4 h-4 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  GoDaddy DNS
                </div>
                {creds?.hasGodaddy ? (
                  <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-2.5 h-2.5" />
                    {creds.godaddyDomain}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Not set</span>
                )}
              </div>

              {cnamePreview && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-2 py-1.5">
                  <p className="text-green-700 font-medium mb-0.5">Will create this DNS record:</p>
                  <p className="font-mono text-green-800 text-xs break-all">{cnamePreview}</p>
                </div>
              )}

              <p className="text-muted-foreground leading-relaxed">
                Enter the <strong>apex domain</strong> you manage in GoDaddy (e.g.{" "}
                <code className="text-xs bg-muted px-1 rounded">mysite.com</code>) plus API keys so
                we can create DNS records for your mini-apps host.
              </p>
              <div className="space-y-1.5">
                <input
                  value={gdKey}
                  onChange={(e) => setGdKey(e.target.value)}
                  placeholder="GoDaddy API Key"
                  className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-background focus:outline-none"
                  data-testid="input-godaddy-key"
                />
                <input
                  value={gdSecret}
                  onChange={(e) => setGdSecret(e.target.value)}
                  placeholder="GoDaddy Secret"
                  type="password"
                  className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-background focus:outline-none"
                  data-testid="input-godaddy-secret"
                />
                <input
                  value={gdDomain}
                  onChange={(e) => setGdDomain(e.target.value)}
                  placeholder="mysite.com (no https:// or www)"
                  className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-background focus:outline-none"
                  data-testid="input-godaddy-domain"
                />
                <button
                  type="button"
                  onClick={() => {
                    const d = getSuggestedGoDaddyDomain();
                    if (d) setGdDomain(d);
                  }}
                  className="w-full py-1.5 rounded-lg text-xs font-semibold border border-green-600/40 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30"
                >
                  Fill domain from NEXT_PUBLIC_SITE_URL
                </button>
                <a
                  href="https://developer.godaddy.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-green-700 underline"
                >
                  Get API keys <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <button
                  onClick={() =>
                    save(
                      { godaddyApiKey: gdKey, godaddyApiSecret: gdSecret, godaddyDomain: gdDomain },
                      "godaddy",
                    )
                  }
                  disabled={
                    !gdKey.trim() || !gdSecret.trim() || !gdDomain.trim() || saving === "godaddy"
                  }
                  className="w-full py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition-all hover:opacity-90"
                  style={{ background: GREEN }}
                  data-testid="button-save-godaddy"
                >
                  {saving === "godaddy" ? (
                    <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                  ) : creds?.hasGodaddy ? (
                    "Update GoDaddy"
                  ) : (
                    "Connect GoDaddy"
                  )}
                </button>
              </div>
            </div>

            {/* ── Step 3: Google ── */}
            <div
              className={`rounded-xl p-3 border-2 text-xs space-y-2 ${creds?.hasGoogle ? "border-blue-300 bg-blue-50/60" : "border-dashed border-border bg-muted/20"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  Google Search Console
                </div>
                {creds?.hasGoogle ? (
                  <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-2.5 h-2.5" />
                    Connected
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Not set</span>
                )}
              </div>

              {sitemapPreview && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-2 py-1.5">
                  <p className="text-blue-700 font-medium mb-0.5">Sitemap to submit:</p>
                  <p className="font-mono text-blue-800 text-xs break-all">{sitemapPreview}</p>
                </div>
              )}

              <p className="text-muted-foreground leading-relaxed">
                Enter your site URL to auto-ping Google whenever new pages are created.
              </p>
              <div className="space-y-1.5">
                <input
                  value={googleUrl}
                  onChange={(e) => setGoogleUrl(e.target.value)}
                  placeholder="https://svivva.com"
                  className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-background focus:outline-none"
                  data-testid="input-google-site-url"
                />
                <button
                  onClick={() => save({ googleSiteUrl: googleUrl }, "google")}
                  disabled={!googleUrl.trim() || saving === "google"}
                  className="w-full py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition-all hover:opacity-90"
                  style={{ background: BLUE }}
                  data-testid="button-save-google"
                >
                  {saving === "google" ? (
                    <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                  ) : creds?.hasGoogle ? (
                    "Update"
                  ) : (
                    "Save Site URL"
                  )}
                </button>
                {(creds?.hasGoogle || googleUrl) && (
                  <button
                    onClick={pingGoogle}
                    disabled={googlePinging}
                    className="w-full py-1.5 rounded-lg text-xs font-medium border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50 flex items-center justify-center gap-1"
                    data-testid="button-ping-google"
                  >
                    {googlePinging ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Globe className="w-3 h-3" />
                    )}
                    Ping Google Sitemap Now
                  </button>
                )}
                {googlePingResult && (
                  <p className="text-blue-700 bg-blue-50 rounded px-2 py-1">{googlePingResult}</p>
                )}
                {sitemapPreview &&
                  (() => {
                    const rawUrl = googleUrl || creds?.googleSiteUrl || "";
                    const normalizedUrl =
                      rawUrl.trim() && !rawUrl.trim().endsWith("/")
                        ? rawUrl.trim() + "/"
                        : rawUrl.trim();
                    return normalizedUrl ? (
                      <a
                        href={`https://search.google.com/search-console/sitemaps?resource_id=${encodeURIComponent(normalizedUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-700 underline"
                      >
                        Open Google Search Console <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <a
                        href="https://search.google.com/search-console/welcome"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-700 underline"
                      >
                        Open Google Search Console <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    );
                  })()}
              </div>
            </div>
          </div>

          {/* Pipeline button */}
          {hasAnySetup && (
            <div className="space-y-3">
              <button
                onClick={runPipeline}
                disabled={pipelineRunning}
                className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all hover:opacity-90 disabled:opacity-60 active:scale-[0.99]"
                style={{
                  background: `linear-gradient(135deg, ${PINK} 0%, #9c27b0 55%, #673ab7 100%)`,
                }}
                data-testid="button-run-full-pipeline"
              >
                {pipelineRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Running full pipeline…
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Run Full Marketing Pipeline
                  </>
                )}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                Generates landing pages for your mini tools → creates DNS CNAME on GoDaddy → pings
                Google + IndexNow
              </p>

              {/* Pipeline result */}
              {pipelineResult && (
                <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                  <div
                    className={`px-3 py-2.5 text-xs font-semibold flex items-center gap-2 ${pipelineResult.summary?.startsWith("✓") ? "text-green-700 bg-green-50 border-b border-green-100" : "bg-muted/40 border-b border-border text-foreground"}`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {pipelineResult.summary || "Pipeline complete"}
                  </div>
                  <div className="p-3 space-y-1.5">
                    {pipelineResult.log?.map((item, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2 px-2.5 py-1.5 rounded-lg text-xs ${item.status === "ok" ? "bg-green-50 text-green-700" : item.status === "error" ? "bg-red-50 text-red-600" : "bg-muted/40 text-muted-foreground"}`}
                      >
                        {item.status === "ok" ? (
                          <CheckCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        ) : item.status === "error" ? (
                          <XCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="font-semibold">{item.step}: </span>
                          {item.detail}
                        </div>
                      </div>
                    ))}
                    {pipelineResult.createdPages && pipelineResult.createdPages.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border space-y-1">
                        <p className="text-xs font-semibold text-foreground">New pages created:</p>
                        {pipelineResult.createdPages.map((p) => (
                          <a
                            key={p.slug}
                            href={`/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-white border border-border hover:bg-muted/20 transition-colors text-foreground"
                          >
                            <ExternalLink className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{p.title}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {!hasAnySetup && (
            <p className="text-center text-xs text-muted-foreground py-2">
              Start by entering your mini apps URL above — that's all you need to generate landing
              pages
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Action result cards ────────────────────────────────────────────────────────
function AutopilotCard({ action }: { action: any }) {
  return (
    <div className="rounded-xl overflow-hidden border border-green-200 text-xs mt-2">
      <div
        className="px-3 py-2 font-semibold text-white flex items-center gap-2"
        style={{ background: TEAL }}
      >
        <CheckCircle className="w-3.5 h-3.5" /> {action.created} pieces of content created
      </div>
      <div className="bg-white dark:bg-card p-3 space-y-2">
        <p className="text-muted-foreground">{action.message}</p>
        {action.indexnow?.submitted && (
          <p className="text-green-700">✓ {action.indexnow.count} URLs sent to Bing & Yandex</p>
        )}
        {action.log?.length > 0 && (
          <div className="space-y-1 mt-1 max-h-36 overflow-y-auto">
            {action.log.map((item: any, i: number) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-2 py-1 rounded ${item.action === "created" ? "bg-green-50" : "bg-red-50"}`}
              >
                {item.action === "created" ? (
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                )}
                <span className="truncate flex-1">{item.title}</span>
                <span className="text-muted-foreground flex-shrink-0">
                  {item.type?.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function IndexNowCard({ action }: { action: any }) {
  return (
    <div
      className={`rounded-xl px-3 py-2.5 text-xs mt-2 flex items-start gap-2 ${action.success ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"}`}
    >
      {action.success ? (
        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      )}
      <div>
        <p className="font-semibold">{action.success ? "IndexNow active" : "Error"}</p>
        <p>{action.message || (action.submitted ? `${action.submitted} URLs submitted` : "")}</p>
      </div>
    </div>
  );
}

function MiniAppsCard({ action }: { action: any }) {
  const router = useRouter();
  return (
    <div
      className="rounded-xl overflow-hidden border text-xs mt-2"
      style={{ borderColor: PINK + "40" }}
    >
      <div
        className="px-3 py-2 font-semibold text-white flex items-center gap-2"
        style={{ background: `linear-gradient(135deg, ${PINK}, #9c27b0)` }}
      >
        <Package className="w-3.5 h-3.5" /> {action.appName} — {action.totalApps} mini-apps
        discovered
      </div>
      <div className="bg-white dark:bg-card p-3 space-y-2">
        <p className="text-muted-foreground">{action.message}</p>
        {action.firstBatch?.length > 0 && (
          <div className="space-y-1">
            <p className="font-semibold text-foreground">First 5 pages created:</p>
            {action.firstBatch.map((page: any, i: number) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1 rounded bg-green-50">
                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                <span className="truncate flex-1">{page.title || page.slug}</span>
                {page.url && (
                  <a href={page.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
        {action.remaining > 0 && (
          <button
            onClick={() => router.push("/dashboard/marketing/mini-apps")}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-white font-semibold text-xs transition-all hover:opacity-90"
            style={{ background: PINK }}
          >
            Generate remaining {action.remaining} pages <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function SocialCard({ action }: { action: any }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const icons: Record<string, any> = {
    twitter: Twitter,
    linkedin: Linkedin,
    reddit: MessageSquare,
  };
  return (
    <div className="rounded-xl border border-border overflow-hidden text-xs mt-2">
      <div className="px-3 py-2 font-semibold bg-muted/40 border-b border-border flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5" style={{ color: PINK }} /> {action.posts?.length || 0}{" "}
        social posts generated
      </div>
      <div className="divide-y divide-border">
        {(action.posts || []).map((post: any, i: number) => {
          const Icon = icons[post.platform] || Globe;
          return (
            <div key={i}>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/20 transition-colors"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <Icon
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{
                    color:
                      post.platform === "twitter"
                        ? "#1DA1F2"
                        : post.platform === "linkedin"
                          ? "#0A66C2"
                          : "#FF4500",
                  }}
                />
                <span className="flex-1 truncate font-medium capitalize">
                  {post.platform} · {post.title}
                </span>
                {expanded === i ? (
                  <ChevronUp className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                )}
              </button>
              {expanded === i && (
                <div className="px-3 pb-3 space-y-2 bg-muted/10">
                  <p className="whitespace-pre-wrap bg-white dark:bg-card rounded-lg p-2.5 border border-border">
                    {post.copy}
                  </p>
                  {post.hashtags?.length > 0 && (
                    <p className="font-medium" style={{ color: PINK }}>
                      {post.hashtags.map((h: string) => `#${h}`).join(" ")}
                    </p>
                  )}
                  <CopyBtn
                    text={`${post.copy}\n\n${post.hashtags?.map((h: string) => `#${h}`).join(" ") || ""}\n${post.url || ""}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusCard({ action, infra, gSearch }: { action: any; infra?: Infra; gSearch?: GSearch }) {
  const items = [
    {
      ok: !!gSearch?.indexnow.key,
      label: "IndexNow",
      detail: gSearch?.indexnow.key ? "Active" : "Not set up",
    },
    {
      ok: !!infra?.domain.hasGodaddyCreds,
      label: "Custom Domain",
      detail: infra?.domain.domain || "Not connected",
    },
    {
      ok: (infra?.content.seedMarketingPages ?? 0) > 0,
      label: "Mini-App Pages",
      detail: `${infra?.content.seedMarketingPages ?? 0} live`,
    },
    {
      ok: !!gSearch?.google.hasServiceAccount,
      label: "Google Indexing API",
      detail: gSearch?.google.hasServiceAccount ? "Connected" : "Not set up",
    },
  ];
  return (
    <div className="rounded-xl border border-border overflow-hidden text-xs mt-2">
      <div className="px-3 py-2 font-semibold bg-muted/40 border-b border-border flex items-center gap-2">
        <Activity className="w-3.5 h-3.5" style={{ color: TEAL }} /> Marketing Status
      </div>
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {items.map(({ ok, label, detail }) => (
            <div
              key={label}
              className={`flex items-start gap-2 p-2 rounded-lg ${ok ? "bg-green-50 border border-green-200" : "bg-muted/40 border border-border"}`}
            >
              {ok ? (
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{label}</p>
                <p className="text-muted-foreground">{detail}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-1">
          {[
            {
              label: "Total URLs",
              value: gSearch?.totalUrls ?? infra?.content.totalSitemapUrls ?? 0,
            },
            { label: "Blog Posts", value: infra?.content.blogPosts ?? 0 },
            { label: "Mini-Apps", value: infra?.content.seedMarketingPages ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-muted/40 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-foreground">{value}</p>
              <p className="text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Google Search Console Setup Card ──────────────────────────────────────────
function GscSetupCard({ siteUrl }: { siteUrl: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [tokenSaving, setTokenSaving] = useState(false);
  const [tokenSaved, setTokenSaved] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const domain = siteUrl.replace(/\/$/, "") || "https://svivva.com";
  const sitemapUrl = `${domain}/sitemap.xml`;

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  const saveToken = async () => {
    const clean = token.trim();
    if (!clean) return;
    setTokenSaving(true);
    setTokenError("");
    try {
      const res = await authFetch("/api/seeds/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleVerificationToken: clean }),
      });
      if (!res.ok) throw new Error("Save failed");
      setTokenSaved(true);
      setTimeout(() => setTokenSaved(false), 4000);
    } catch {
      setTokenError("Failed to save — try again");
    } finally {
      setTokenSaving(false);
    }
  };

  const steps = [
    {
      num: 1,
      color: "#1a73e8",
      title: "Open Google Search Console",
      detail:
        "Go to search.google.com/search-console and sign in with the Google account that owns your site.",
      action: (
        <a
          href="https://search.google.com/search-console"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg text-white mt-1"
          style={{ background: "#1a73e8" }}
        >
          Open GSC <ExternalLink className="w-3 h-3" />
        </a>
      ),
    },
    {
      num: 2,
      color: "#34a853",
      title: "Verify ownership — paste your token here",
      detail:
        "In GSC: click 'Add property' → enter svivva.com → choose 'HTML tag' method → copy only the content=\"...\" value → paste it below and save. Svivva will inject the tag into your site automatically.",
      action: (
        <div className="mt-2 space-y-1.5">
          <p className="text-xs text-muted-foreground">
            Example — Google gives you:{" "}
            <code className="bg-muted px-1 rounded text-xs">
              {'<meta name="google-site-verification" content="AbC123XyZ" />'}
            </code>
            <br />
            Paste only the highlighted part:{" "}
            <code className="bg-green-100 text-green-800 px-1 rounded text-xs font-semibold">
              AbC123XyZ
            </code>
          </p>
          <div className="flex items-center gap-2">
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste verification token here…"
              className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-background focus:outline-none focus:ring-1 focus:ring-green-400"
            />
            <button
              onClick={saveToken}
              disabled={tokenSaving || !token.trim()}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-50 transition-all"
              style={{ background: "#34a853" }}
            >
              {tokenSaving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : tokenSaved ? (
                <CheckCircle className="w-3 h-3" />
              ) : null}
              {tokenSaving ? "Saving…" : tokenSaved ? "Saved!" : "Save"}
            </button>
          </div>
          {tokenSaved && (
            <p className="text-xs text-green-700 font-medium">
              ✓ Token saved — your site now has the verification meta tag. Go back to GSC and click
              'Verify'.
            </p>
          )}
          {tokenError && <p className="text-xs text-red-500">{tokenError}</p>}
        </div>
      ),
    },
    {
      num: 3,
      color: "#fbbc04",
      title: "Submit your sitemap",
      detail: "In GSC go to Indexing → Sitemaps. Paste your sitemap URL below and click Submit.",
      action: (
        <div className="flex items-center gap-2 mt-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5">
          <code className="text-xs font-mono text-blue-800 flex-1 truncate">{sitemapUrl}</code>
          <button
            onClick={() => copy(sitemapUrl, "sitemap")}
            className="flex items-center gap-1 text-xs font-semibold flex-shrink-0 px-2 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Copy className="w-3 h-3" />
            {copied === "sitemap" ? "Copied!" : "Copy"}
          </button>
        </div>
      ),
    },
    {
      num: 4,
      color: "#ea4335",
      title: "Speed up indexing with URL Inspection",
      detail:
        "In GSC, use the search bar at the top to inspect your most important pages, then click 'Request Indexing' on each one.",
      action: (
        <div className="mt-1 space-y-1">
          {[
            { url: domain, label: "Homepage" },
            { url: `${domain}/clutety`, label: "Clutety" },
            { url: `${domain}/blog`, label: "Blog" },
            { url: `${domain}/tools`, label: "Tools Hub" },
            { url: `${domain}/lp/ai-api-builder`, label: "LP: Builder" },
            { url: `${domain}/lp/prompt-to-api`, label: "LP: Prompt to API" },
            { url: `${domain}/lp/ai-app-generator`, label: "LP: AI App Generator" },
          ].map(({ url, label }) => (
            <div
              key={url}
              className="flex items-center gap-2 rounded border border-border bg-muted/30 px-2 py-1"
            >
              <span className="text-xs text-muted-foreground w-28 flex-shrink-0 font-medium">
                {label}
              </span>
              <code className="text-xs font-mono flex-1 truncate text-muted-foreground">{url}</code>
              <button
                onClick={() => copy(url, url)}
                className="flex items-center gap-0.5 text-xs font-medium flex-shrink-0"
                style={{ color: PINK }}
              >
                <Copy className="w-2.5 h-2.5" />
                {copied === url ? "Copied" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-white dark:bg-card shadow-sm overflow-hidden mb-3">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background:
              "linear-gradient(135deg, #4285F4 0%, #34A853 50%, #FBBC04 75%, #EA4335 100%)",
          }}
        >
          <Globe className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Google Search Console Setup</p>
          <p className="text-xs text-muted-foreground">
            You must do this manually — Google requires human domain verification
          </p>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 flex-shrink-0">
          Required
        </span>
      </div>

      <div className="px-4 py-3 space-y-3">
        {steps.map(({ num, color, title, detail, action }) => (
          <div key={num} className="flex gap-3">
            <div
              className="flex-shrink-0 w-5 h-5 rounded-full text-white flex items-center justify-center text-xs font-bold mt-0.5"
              style={{ background: color }}
            >
              {num}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{detail}</p>
              {action}
            </div>
          </div>
        ))}

        <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-800 flex items-start gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
          <span>
            Once submitted, Google will index your <strong>{sitemapUrl.split("/").pop()}</strong>{" "}
            which already contains <strong>1,200+ URLs</strong>. Full crawl typically takes 1–4
            weeks for a new domain.
          </span>
        </div>
      </div>
    </div>
  );
}

function ComparisonCard({ action }: { action: any }) {
  return (
    <div
      className={`rounded-xl px-3 py-2.5 text-xs mt-2 ${action.total > 0 ? "bg-green-50 border border-green-200 text-green-700" : "bg-yellow-50 border border-yellow-200 text-yellow-700"}`}
    >
      <p className="font-semibold">
        {action.total > 0
          ? `✓ ${action.total} comparison pages created`
          : "No comparison pages created"}
      </p>
      {action.indexnow?.submitted && <p>✓ URLs submitted to Bing & Yandex</p>}
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
  action?: any;
}

function MessageBubble({
  msg,
  infra,
  gSearch,
}: {
  msg: Message;
  infra?: Infra;
  gSearch?: GSearch;
}) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `linear-gradient(135deg, ${PINK}, #9c27b0)` }}
        >
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={`flex-1 min-w-0 ${isUser ? "flex flex-col items-end" : ""}`}>
        <div
          className={`inline-block max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isUser ? "text-white rounded-tr-sm" : "bg-white dark:bg-card border border-border rounded-tl-sm text-foreground"}`}
          style={isUser ? { background: PINK } : {}}
        >
          {msg.content}
        </div>
        {msg.action && !isUser && (
          <div className="max-w-[90%]">
            {msg.action.type === "autopilot" && <AutopilotCard action={msg.action} />}
            {msg.action.type === "indexnow" && <IndexNowCard action={msg.action} />}
            {msg.action.type === "mini_apps" && <MiniAppsCard action={msg.action} />}
            {msg.action.type === "social" && <SocialCard action={msg.action} />}
            {msg.action.type === "status" && (
              <StatusCard action={msg.action} infra={infra} gSearch={gSearch} />
            )}
            {msg.action.type === "comparisons" && <ComparisonCard action={msg.action} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Suggestion chips ───────────────────────────────────────────────────────────
const SUGGESTIONS = [
  {
    icon: Zap,
    label: "Set up IndexNow",
    prompt: "Set up IndexNow and submit all my URLs to Bing and Yandex",
  },
  {
    icon: Package,
    label: "Generate 50 pages",
    prompt: "Generate 50 marketing pages for Svivva Seeds at svivva.com",
  },
  {
    icon: Rocket,
    label: "Run autopilot",
    prompt: "Run AI autopilot in balanced mode to create new blog posts and SEO pages",
  },
  {
    icon: Sparkles,
    label: "Social posts",
    prompt: "Generate social media posts for my recent pages",
  },
  { icon: Activity, label: "Check status", prompt: "What's my current marketing status?" },
  {
    icon: Globe,
    label: "Comparison pages",
    prompt: "Generate comparison pages vs Bubble, Webflow, and Glide",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function MarketingDashboard() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your Svivva Marketing AI. Connect your apps, GoDaddy, and Google above — then hit Run Pipeline to link everything automatically, or just tell me what you want to do.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: me, isLoading: meLoading } = useQuery<{
    isAdmin: boolean;
    user: { id: string } | null;
  }>({
    queryKey: ["/api/auth/me"],
    queryFn: () => authFetch("/api/auth/me").then((r) => r.json()),
  });
  useEffect(() => {
    if (!meLoading && me && !me.isAdmin) router.replace("/dashboard");
  }, [me, meLoading, router]);

  const {
    data: infra,
    isLoading,
    refetch,
  } = useQuery<Infra>({
    queryKey: ["/api/marketing/infrastructure"],
    queryFn: () => authFetch("/api/marketing/infrastructure").then((r) => r.json()),
    enabled: !!me?.isAdmin,
  });
  const { data: gSearch, refetch: refetchGoogle } = useQuery<GSearch>({
    queryKey: ["/api/marketing/google-search"],
    queryFn: () => authFetch("/api/marketing/google-search").then((r) => r.json()),
    enabled: !!me?.isAdmin,
  });
  const { data: creds, refetch: refetchCreds } = useQuery<Creds>({
    queryKey: ["/api/seeds/credentials"],
    queryFn: () => authFetch("/api/seeds/credentials").then((r) => r.json()),
    enabled: !!me?.isAdmin,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await authFetch("/api/marketing/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history,
          context: {
            hasGodaddy: creds?.hasGodaddy,
            hasGoogle: creds?.hasGoogle,
            godaddyDomain: creds?.godaddyDomain,
          },
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || data.error || "Something went wrong.",
          action: data.action || null,
        },
      ]);
      if (data.action?.type !== "advice") {
        refetch();
        refetchGoogle();
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I hit an error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  if (meLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  if (!me?.isAdmin) return null;

  const totalUrls = gSearch?.totalUrls ?? infra?.content.totalSitemapUrls ?? 0;
  const stepsConfig = [
    { ok: !!gSearch?.indexnow.key, label: "IndexNow active" },
    {
      ok: (infra?.content.seedMarketingPages ?? 0) > 0,
      label: `Mini-apps: ${infra?.content.seedMarketingPages ?? 0}`,
    },
    { ok: !!infra?.domain.hasGodaddyCreds, label: "Domain connected" },
    { ok: !!gSearch?.google.hasServiceAccount, label: "Google API" },
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #fdf2f8 0%, #f9fafb 60%)" }}
    >
      {/* GSC Setup — shown first so every user sees it */}
      <div className="flex-shrink-0 px-4 pt-4 pb-0 max-w-3xl mx-auto w-full">
        <GscSetupCard siteUrl={infra?.google.siteUrl || "https://svivva.com"} />
      </div>

      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-2 pb-2 max-w-3xl mx-auto w-full">
        <div
          className="rounded-2xl p-4 text-white relative overflow-hidden shadow-lg mb-3"
          style={{ background: `linear-gradient(135deg, ${PINK} 0%, #9c27b0 55%, #673ab7 100%)` }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 50%)",
            }}
          />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold">Marketing AI</h1>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Admin</span>
                </div>
                <p className="text-pink-100 text-xs">
                  Connect your services → run the pipeline → watch traffic grow
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-right text-xs">
                <p className="text-white font-bold">{isLoading ? "—" : totalUrls}</p>
                <p className="text-pink-200">URLs live</p>
              </div>
              <button
                onClick={() => {
                  refetch();
                  refetchGoogle();
                  refetchCreds();
                }}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {/* Status pills */}
          <div className="relative flex flex-wrap gap-1.5 mt-3">
            {stepsConfig.map(({ ok, label }) => (
              <div
                key={label}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${ok ? "bg-white/20 text-white" : "bg-black/15 text-pink-200"}`}
              >
                {ok ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Connection Hub */}
        <ConnectionHub
          creds={creds || null}
          onRefresh={() => {
            refetchCreds();
            refetch();
            refetchGoogle();
          }}
        />

        {/* Seeds Marketing Shortcut */}
        <a
          href="/seeds"
          className="block rounded-xl border border-border bg-white dark:bg-card hover:bg-muted/20 transition-colors overflow-hidden shadow-sm group"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #6B2C4A, #5BA8A0)" }}
            >
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Svivva Seeds Marketing Funnel</p>
              <p className="text-xs text-muted-foreground truncate">
                Auto Marketing Funnel panel · App linking · Domain setup · Traffic AI Chat
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
          </div>
        </a>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 max-w-3xl mx-auto w-full space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} infra={infra} gSearch={gSearch} />
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: `linear-gradient(135deg, ${PINK}, #9c27b0)` }}
            >
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="px-4 py-3 bg-white dark:bg-card border border-border rounded-2xl rounded-tl-sm flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: PINK }} />
              <span className="text-sm text-muted-foreground">Working on it...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips — only show when no user messages sent yet */}
      {messages.length <= 1 && (
        <div className="flex-shrink-0 px-4 pb-2 max-w-3xl mx-auto w-full">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
              <button
                key={label}
                onClick={() => send(prompt)}
                className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-full border border-border bg-white dark:bg-card text-xs font-medium text-foreground hover:border-pink-300 hover:bg-pink-50 transition-all shadow-sm active:scale-95"
              >
                <Icon className="w-3.5 h-3.5 sm:w-3 sm:h-3 flex-shrink-0" style={{ color: PINK }} />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="flex-shrink-0 px-3 sm:px-4 pb-4 sm:pb-4 pt-2 max-w-3xl mx-auto w-full">
        <div
          className="flex gap-2 bg-white dark:bg-card border border-border rounded-2xl shadow-md p-2"
          style={{ borderColor: input ? PINK + "60" : undefined }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Generate 50 pages, run autopilot, set up IndexNow, check my status…"
            rows={1}
            data-testid="input-marketing-chat"
            className="flex-1 bg-transparent text-sm resize-none focus:outline-none px-2 py-1.5 min-h-[40px] max-h-32"
            style={{ overflowY: "auto" }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="w-11 h-11 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 self-end transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
            style={{ background: PINK }}
            data-testid="button-chat-send"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2 hidden sm:block">
          Press Enter to send · Shift+Enter for new line
        </p>
        <p className="text-center text-xs text-muted-foreground mt-2 sm:hidden">
          Tap the send button to submit
        </p>
      </div>

      {/* Collapsible reference guide */}
      <div className="flex-shrink-0 px-4 pb-6 max-w-3xl mx-auto w-full">
        <button
          onClick={() => setShowSteps(!showSteps)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-card border border-border rounded-xl text-sm text-muted-foreground hover:bg-muted/30 transition-all shadow-sm"
        >
          <span className="font-medium">What can I ask the AI to do?</span>
          {showSteps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showSteps && (
          <div className="mt-2 bg-white dark:bg-card border border-border rounded-xl p-4 space-y-3 text-xs shadow-sm">
            {[
              {
                icon: Zap,
                title: "Set up IndexNow",
                desc: '"Set up IndexNow and submit my URLs to Bing"',
                detail:
                  "Generates a free key and submits all your pages to Bing & Yandex within seconds.",
              },
              {
                icon: Package,
                title: "Generate mini-app pages",
                desc: '"Generate 50 marketing pages for my app at apps.svivva.com"',
                detail:
                  "AI discovers 50 tool names for your app and writes a unique SEO page for each one.",
              },
              {
                icon: Rocket,
                title: "Run AI Autopilot",
                desc: '"Run autopilot on aggressive mode"',
                detail:
                  "Creates blog posts and SEO landing pages automatically, then submits them to search engines.",
              },
              {
                icon: Sparkles,
                title: "Social media posts",
                desc: '"Write social posts for my recent pages"',
                detail:
                  "Generates copy for Twitter, LinkedIn, and Reddit — ready to paste and post.",
              },
              {
                icon: Globe,
                title: "Comparison pages",
                desc: '"Generate comparison pages vs Notion and Airtable"',
                detail:
                  "Creates dedicated 'Your App vs Competitor' pages that rank for comparison searches.",
              },
              {
                icon: Activity,
                title: "Check status",
                desc: '"What\'s set up? What should I do next?"',
                detail: "Shows a full rundown of what's active and what's not yet configured.",
              },
            ].map(({ icon: Icon, title, desc, detail }) => (
              <div key={title} className="flex gap-3">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: PINK + "15" }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: PINK }} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="font-mono text-muted-foreground mt-0.5 truncate">{desc}</p>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">{detail}</p>
                </div>
              </div>
            ))}
            {/* Automated vs Manual guide */}
            <div className="border-t border-border pt-3 space-y-2">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" style={{ color: TEAL }} /> What runs automatically vs
                what you do manually
              </p>
              <div className="rounded-xl overflow-hidden border border-border text-xs">
                {/* Automated */}
                <div className="bg-green-50 dark:bg-green-950/20 px-3 py-2.5 space-y-1">
                  <p className="font-bold text-green-700 dark:text-green-400 uppercase tracking-wider text-[10px]">
                    ✅ Fully automated (no action needed)
                  </p>
                  {[
                    "IndexNow key generation — submits all your URLs to Bing, Yandex, Yahoo, DuckDuckGo instantly",
                    "SEO landing pages — AI writes and publishes them to svivva.com/{slug} automatically",
                    "Blog posts — written and published at svivva.com/blog immediately",
                    "AEO answer pages — published so Perplexity/ChatGPT Search can cite them",
                    "Tool pages for Pyracrypt — 4 keyword pages per tool, live on svivva.com",
                    "Sitemap — updates itself every time a page is created",
                    "Bing sitemap ping — sent automatically after every submit step",
                  ].map((item) => (
                    <p key={item} className="text-green-800 dark:text-green-300 leading-snug pl-1">
                      • {item}
                    </p>
                  ))}
                </div>
                {/* Manual */}
                <div className="bg-amber-50 dark:bg-amber-950/20 px-3 py-2.5 space-y-1 border-t border-border">
                  <p className="font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider text-[10px]">
                    ⚠ You must do these manually
                  </p>
                  {[
                    "Google Search Console → Sitemaps → add https://svivva.com/sitemap.xml (Google ignores IndexNow)",
                    "Google Search Console → URL Inspection → paste each key URL → Request Indexing",
                    "Post social content (Twitter thread, LinkedIn, Reddit) — AI writes it, you paste and post",
                    "Submit directory listings (Product Hunt, G2, Futurepedia) — requires your account on each site",
                    "Publish parasite SEO articles on Dev.to / Medium / Hashnode — AI writes them, you post",
                    "Send PR / newsletter pitches — AI writes the emails, you send from your inbox",
                    "Add 'Powered by Svivva' widgets to your deployed apps and redeploy",
                    "Wait 24–48h after CNAME setup before testing subdomains (DNS propagation)",
                  ].map((item) => (
                    <p key={item} className="text-amber-900 dark:text-amber-200 leading-snug pl-1">
                      • {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-3 space-y-2">
              <p className="font-semibold text-foreground">External tools:</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline"
                  style={{ color: PINK }}
                >
                  <FileText className="w-3 h-3" /> Sitemap ({totalUrls} URLs)
                </a>
                <a
                  href="https://search.google.com/search-console"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline"
                  style={{ color: PINK }}
                >
                  <Star className="w-3 h-3" /> Google Search Console
                </a>
                <a
                  href="https://www.bing.com/webmasters"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline"
                  style={{ color: PINK }}
                >
                  <Globe className="w-3 h-3" /> Bing Webmaster
                </a>
                <a
                  href="/svivva-marketing-strategy.pdf"
                  download
                  className="inline-flex items-center gap-1 hover:underline"
                  style={{ color: PINK }}
                >
                  <FileText className="w-3 h-3" /> Strategy PDF
                </a>
              </div>
            </div>
            {me?.user?.id && (
              <div className="border-t border-border pt-3">
                <p className="font-semibold text-foreground flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Admin setup
                </p>
                <p className="text-muted-foreground mt-1">
                  Set <code className="bg-muted px-1 rounded">ADMIN_USER_ID</code> in production
                  secrets so only you (and optional comma-separated co-owners) can use Orbit,
                  Growth, and marketing APIs. Your id is below:
                </p>
                <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-2.5 py-1.5 mt-1 font-mono break-all">
                  <span className="flex-1 text-xs">{me.user.id}</span>
                  <CopyBtn text={me.user.id} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
