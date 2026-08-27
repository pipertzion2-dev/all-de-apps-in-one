"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Search, Sparkles } from "lucide-react";
import { authFetch } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TEAL = "#5B8DA8";

type Tab = "overview" | "indexing" | "opportunities" | "integrations" | "sitemaps" | "settings";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "indexing", label: "Indexing" },
  { id: "opportunities", label: "Opportunities" },
  { id: "sitemaps", label: "Sitemaps" },
  { id: "integrations", label: "Integrations" },
  { id: "settings", label: "Settings" },
];

type IndexFilter =
  | "all"
  | "healthy"
  | "not_indexable"
  | "sitemap_issues"
  | "seo_issues"
  | "no_google_impressions";

export function OrbitSeoManager() {
  const [tab, setTab] = useState<Tab>("overview");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);
  const [indexing, setIndexing] = useState<{
    apps: Array<Record<string, unknown>>;
    note?: string;
  } | null>(null);
  const [opportunities, setOpportunities] = useState<Array<Record<string, unknown>>>([]);
  const [integrations, setIntegrations] = useState<Record<string, unknown> | null>(null);
  const [filter, setFilter] = useState<IndexFilter>("all");

  const load = useCallback(async (view: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await authFetch(`/api/orbit/seo/manager?view=${view}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      if (view === "overview") setOverview(data.overview);
      if (view === "indexing") setIndexing(data);
      if (view === "opportunities") setOpportunities(data.opportunities || []);
      if (view === "integrations") setIntegrations(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load(tab === "sitemaps" || tab === "settings" ? "overview" : tab);
  }, [tab, load]);

  const runAction = async (action: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await authFetch("/api/orbit/seo/manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      await load(tab === "sitemaps" || tab === "settings" ? "overview" : tab);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const filteredApps = useMemo(() => {
    const apps = indexing?.apps || [];
    return apps.filter((a) => {
      const c = (a.check || {}) as Record<string, unknown>;
      if (filter === "all") return true;
      if (filter === "healthy") return c.needsAttention === false && c.indexable === true;
      if (filter === "not_indexable") return c.indexable === false;
      if (filter === "sitemap_issues") return c.sitemapIncluded === false;
      if (filter === "seo_issues") return c.metadataComplete === false || c.crawlable === false;
      if (filter === "no_google_impressions") return c.googleTrafficDetected === false;
      return true;
    });
  }, [indexing, filter]);

  return (
    <div
      className="rounded-2xl border-2 overflow-hidden"
      style={{
        borderColor: `${TEAL}44`,
        background: `linear-gradient(135deg, ${TEAL}08, #6B2C4E05)`,
      }}
      data-testid="orbit-seo-manager"
      id="orbit-seo-manager"
    >
      <div className="px-4 py-3 border-b border-border/40 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-black flex items-center gap-2">
            <Search className="w-4 h-4" style={{ color: TEAL }} />
            SEO &amp; Indexing Manager
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Publish → /apps/&#123;slug&#125; → sitemap → discovery → Orbit analysis (no GSC iframe)
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void runAction("sync_curated")}
          >
            Sync curated apps
          </Button>
          <Button size="sm" disabled={busy} onClick={() => void runAction("run_jobs")}>
            {busy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span className="ml-1">Run SEO jobs</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 px-3 pt-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
              tab === t.id
                ? "border-[#5B8DA8]/50 bg-[#5B8DA8]/15"
                : "border-border/50 text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {error ? (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> {error}
          </p>
        ) : null}

        {tab === "overview" && overview ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                ["Public apps", overview.totalPublicMiniApps],
                ["Indexable", overview.indexableApps],
                ["Needs attention", overview.appsNeedingAttention],
                ["Organic clicks", overview.organicClicks],
                ["Impressions", overview.searchImpressions],
                [
                  "CTR",
                  typeof overview.ctr === "number" ? `${(overview.ctr * 100).toFixed(1)}%` : "—",
                ],
                [
                  "Avg position",
                  typeof overview.averageGooglePosition === "number"
                    ? (overview.averageGooglePosition as number).toFixed(1)
                    : "—",
                ],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-lg border border-border/50 p-2.5 bg-card/40"
                >
                  <p className="text-[10px] text-muted-foreground">{String(label)}</p>
                  <p className="text-sm font-bold mt-0.5">{String(value ?? "—")}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {String(overview.disclaimer || "")}
            </p>
            <div>
              <p className="text-xs font-bold mb-1.5">Biggest opportunities</p>
              <ul className="space-y-1.5">
                {((overview.topOpportunities as Array<Record<string, string>>) || []).map((o) => (
                  <li key={o.id} className="text-xs rounded border border-border/40 p-2">
                    <p className="font-medium">{o.title}</p>
                    <p className="text-muted-foreground mt-0.5">{o.recommendedAction}</p>
                  </li>
                ))}
                {!((overview.topOpportunities as unknown[]) || []).length ? (
                  <li className="text-xs text-muted-foreground">
                    No open opportunities yet — sync apps and refresh GSC snapshots.
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        ) : null}

        {tab === "indexing" ? (
          <div className="space-y-3">
            <p className="text-[10px] text-muted-foreground">{indexing?.note}</p>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  "all",
                  "healthy",
                  "not_indexable",
                  "sitemap_issues",
                  "seo_issues",
                  "no_google_impressions",
                ] as IndexFilter[]
              ).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`text-[10px] px-2 py-1 rounded border ${
                    filter === f ? "border-[#5B8DA8]/50 bg-[#5B8DA8]/15" : "border-border/50"
                  }`}
                >
                  {f.replace(/_/g, " ")}
                </button>
              ))}
            </div>
            <ul className="space-y-2 max-h-[28rem] overflow-auto">
              {filteredApps.map((a) => {
                const c = (a.check || {}) as Record<string, unknown>;
                return (
                  <li
                    key={String(a.id)}
                    className="rounded-lg border border-border/50 p-3 text-xs space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm">{String(a.name)}</p>
                        <Link
                          href={String(a.publicPath)}
                          className="text-[10px] text-[#5B8DA8] underline"
                        >
                          {String(a.publicPath)}
                        </Link>
                      </div>
                      {c.needsAttention ? (
                        <Badge variant="outline" className="text-amber-300 border-amber-500/40">
                          Needs attention
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-300 border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Healthy
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {[
                        ["Published", c.published],
                        ["Public", c.isPublic],
                        ["Sitemap", c.sitemapIncluded],
                        ["Crawlable", c.crawlable],
                        ["Indexable", c.indexable],
                        ["Canonical", c.canonicalValid],
                        ["Metadata", c.metadataComplete],
                        ["GSC traffic", c.googleTrafficDetected],
                      ].map(([label, ok]) => (
                        <span
                          key={String(label)}
                          className={`text-[9px] px-1.5 py-0.5 rounded border ${
                            ok
                              ? "border-emerald-500/30 text-emerald-200"
                              : "border-border/50 text-muted-foreground"
                          }`}
                        >
                          {String(label)}
                        </span>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {tab === "opportunities" ? (
          <div className="space-y-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void runAction("recalc_opportunities")}
            >
              Recalculate from GSC snapshots
            </Button>
            {opportunities.map((o) => (
              <div
                key={String(o.id)}
                className="rounded-lg border border-border/50 p-3 text-xs space-y-1"
              >
                <p className="font-bold">{String(o.title)}</p>
                <p className="text-muted-foreground">{String(o.explanation)}</p>
                <p className="text-[#8EB8C8]">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  {String(o.recommendedAction)}
                </p>
              </div>
            ))}
            {!opportunities.length ? (
              <p className="text-xs text-muted-foreground">No open opportunities.</p>
            ) : null}
          </div>
        ) : null}

        {tab === "sitemaps" ? (
          <div className="text-xs space-y-2">
            <p>
              Canonical sitemap:{" "}
              <a
                className="underline text-[#5B8DA8]"
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
              >
                /sitemap.xml
              </a>
            </p>
            <p>
              Apps chunk is included automatically for published public indexable mini-apps. Split
              sitemaps activate when URL volume requires chunking (existing registry +{" "}
              <code>apps</code> chunk).
            </p>
            <p className="text-muted-foreground">
              robots.txt allows /apps/ and lists the sitemap. Private/unpublished apps are removed
              from sitemap entries.
            </p>
          </div>
        ) : null}

        {tab === "integrations" && integrations ? (
          <div className="space-y-3 text-xs">
            <div className="rounded-lg border border-border/50 p-3 space-y-1">
              <p className="font-bold">Google Search Console</p>
              <p className="text-muted-foreground">
                {(integrations.searchConsole as { note?: string })?.note}
              </p>
              <Link href="/dashboard/gsc-connect" className="text-[#5B8DA8] underline">
                Open GSC connect
              </Link>
            </div>
            <div className="rounded-lg border border-border/50 p-3 space-y-1">
              <p className="font-bold">Ahrefs (optional premium)</p>
              <p className="text-muted-foreground">
                {(integrations.ahrefs as { message?: string })?.message}
              </p>
            </div>
          </div>
        ) : null}

        {tab === "settings" ? (
          <div className="text-xs space-y-2 text-muted-foreground">
            <p>
              Env: <code>ORBIT_SEO_SECRETS_KEY</code> (encrypt OAuth/API secrets), existing{" "}
              <code>GOOGLE_GSC_CLIENT_ID</code> / <code>GOOGLE_GSC_CLIENT_SECRET</code>, optional{" "}
              <code>AHREFS_API_KEY</code>.
            </p>
            <p>Public URLs: https://&#123;domain&#125;/apps/&#123;slug&#125;</p>
            <p>Directory: /apps — crawlable internal links.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
