"use client";

/**
 * Orbit Marketing Vision — visual launch status dashboard.
 * Shows every checklist item grouped by type, with one-click actions.
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Zap,
  MousePointerClick,
  Key,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  CircleDot,
} from "lucide-react";
import { authFetch } from "@/hooks/use-auth";

// ─── types ───────────────────────────────────────────────────────────────────

type ActionKind =
  | "auto" // runs automatically via Orbit
  | "credential" // needs API key → auto-publishes
  | "external" // one-click → opens platform URL
  | "mark"; // just mark done manually

type StatusKind = "done" | "running" | "pending" | "needs_creds";

type MarketingItem = {
  id: string;
  label: string;
  description: string;
  kind: ActionKind;
  status: StatusKind;
  url?: string; // for external actions
  credGroup?: "devto" | "hashnode" | "twitter" | "reddit" | "email"; // for credential actions
  icon: string; // emoji
};

// ─── config ──────────────────────────────────────────────────────────────────

const DIRECTORY_URLS: Record<string, string> = {
  "dir-futurepedia": "https://www.futurepedia.io/submit-tool",
  "dir-taaft": "https://theresanaiforthat.com/submit/",
  "dir-g2": "https://www.g2.com/products/new",
  "dir-alternativeto": "https://alternativeto.net/add/",
  "dir-crunchbase": "https://www.crunchbase.com/add-new-profile",
  "dir-producthunt": "https://www.producthunt.com/posts/new",
};

const MANUAL_URLS: Record<string, string> = {
  "manual-showhn": "https://news.ycombinator.com/submit",
  "manual-indiehackers": "https://www.indiehackers.com/submit",
  "manual-gsc-indexing": "https://search.google.com/search-console/url-inspection",
  "manual-producthunt": "https://www.producthunt.com/posts/new",
  "tech-gsc-sitemap": "https://search.google.com/search-console/sitemaps",
  "tech-rich-results": "https://search.google.com/test/rich-results",
};

// ─── mini credential form ─────────────────────────────────────────────────────

const CRED_FIELDS: Record<
  string,
  { key: string; label: string; hint: string; secret?: boolean }[]
> = {
  devto: [
    {
      key: "devtoApiKey",
      label: "Dev.to API Key",
      hint: "dev.to/settings/extensions",
      secret: true,
    },
  ],
  hashnode: [
    {
      key: "hashnodeApiKey",
      label: "Hashnode API Key",
      hint: "hashnode.com/settings/developer",
      secret: true,
    },
    {
      key: "hashnodePublicationId",
      label: "Publication ID",
      hint: "From your publication URL",
    },
  ],
  twitter: [
    { key: "twitterApiKey", label: "API Key", secret: true, hint: "" },
    {
      key: "twitterApiSecret",
      label: "API Secret",
      secret: true,
      hint: "developer.twitter.com",
    },
    {
      key: "twitterAccessToken",
      label: "Access Token",
      secret: true,
      hint: "",
    },
    {
      key: "twitterAccessSecret",
      label: "Access Secret",
      secret: true,
      hint: "",
    },
  ],
  reddit: [
    {
      key: "redditClientId",
      label: "Client ID",
      secret: true,
      hint: "reddit.com/prefs/apps",
    },
    { key: "redditClientSecret", label: "Client Secret", secret: true, hint: "" },
    { key: "redditRefreshToken", label: "Refresh Token", secret: true, hint: "" },
    {
      key: "redditDefaultSubreddit",
      label: "Target subreddit",
      hint: "e.g. SideProject",
    },
  ],
  email: [
    {
      key: "resendApiKey",
      label: "Resend API Key",
      secret: true,
      hint: "resend.com/api-keys",
    },
    {
      key: "outreachFromEmail",
      label: "From Email",
      hint: "e.g. hello@svivva.com",
    },
  ],
};

function CredentialMiniForm({ group, onSaved }: { group: string; onSaved: () => void }) {
  const fields = CRED_FIELDS[group] ?? [];
  const [vals, setVals] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      const res = await authFetch("/api/orbit/marketing-autopilot/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vals),
      });
      if (res.ok) {
        setMsg("Saved! Autopilot will use these on next run.");
        onSaved();
      } else {
        const j = await res.json().catch(() => ({}));
        setMsg(j.error ?? "Save failed");
      }
    } catch {
      setMsg("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/3 p-4 flex flex-col gap-3">
      {fields.map((f) => (
        <div key={f.key} className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-white/40">{f.label}</label>
          <input
            type={f.secret ? "password" : "text"}
            autoComplete="off"
            placeholder={f.hint}
            value={vals[f.key] ?? ""}
            onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-white/20 outline-none focus:border-[#5BA8A0]/50 transition-colors"
          />
        </div>
      ))}
      {msg && (
        <p className={`text-xs ${msg.startsWith("Saved") ? "text-emerald-400" : "text-red-400"}`}>
          {msg}
        </p>
      )}
      <button
        onClick={save}
        disabled={saving}
        className="self-start px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition-all"
        style={{ background: "linear-gradient(135deg,#5BA8A0,#6B2C4A)" }}
      >
        {saving ? "Saving…" : "Save & Activate"}
      </button>
    </div>
  );
}

// ─── single card ─────────────────────────────────────────────────────────────

function ItemCard({
  item,
  onToggleDone,
}: {
  item: MarketingItem;
  onToggleDone: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const isDone = item.status === "done";
  const borderColor = isDone
    ? "border-emerald-500/20"
    : item.kind === "auto" || item.status === "running"
      ? "border-[#5BA8A0]/20"
      : item.kind === "credential"
        ? "border-amber-500/20"
        : "border-white/10";

  const badgeBg = isDone
    ? "bg-emerald-500/10 text-emerald-400"
    : item.status === "running"
      ? "bg-[#5BA8A0]/10 text-[#5BA8A0]"
      : item.kind === "auto"
        ? "bg-[#5BA8A0]/10 text-[#5BA8A0]"
        : item.kind === "credential"
          ? "bg-amber-500/10 text-amber-400"
          : "bg-white/5 text-white/40";

  const badgeLabel = isDone
    ? "Done"
    : item.status === "running"
      ? "Running"
      : item.kind === "auto"
        ? "Auto"
        : item.kind === "credential"
          ? "Needs keys"
          : item.kind === "external"
            ? "Manual"
            : "Mark done";

  return (
    <div
      className={`rounded-2xl border ${borderColor} bg-white/[0.02] transition-all duration-200 ${isDone ? "opacity-60" : ""}`}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() =>
          (item.kind !== "auto" || item.status !== "running") && setExpanded((v) => !v)
        }
      >
        <span className="text-xl flex-shrink-0">{item.icon}</span>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium truncate ${isDone ? "line-through text-white/40" : "text-white/85"}`}
          >
            {item.label}
          </p>
          <p className="text-xs text-white/35 truncate mt-0.5">{item.description}</p>
        </div>
        <span
          className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeBg}`}
        >
          {badgeLabel}
        </span>
        {item.kind !== "auto" && !isDone && (
          <span className="text-white/20 flex-shrink-0">
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </span>
        )}
        {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
      </div>

      {expanded && !isDone && (
        <div className="px-4 pb-4">
          {/* credential kind */}
          {item.kind === "credential" && item.credGroup && (
            <CredentialMiniForm group={item.credGroup} onSaved={() => setExpanded(false)} />
          )}

          {/* external kind */}
          {item.kind === "external" && item.url && (
            <div className="flex gap-2 mt-2">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#5BA8A0,#6B2C4A)" }}
              >
                Open Platform
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => {
                  onToggleDone(item.id);
                  setExpanded(false);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold border border-white/15 text-white/60 hover:text-white transition-all"
              >
                Mark done
              </button>
            </div>
          )}

          {/* mark kind */}
          {item.kind === "mark" && (
            <button
              onClick={() => {
                onToggleDone(item.id);
                setExpanded(false);
              }}
              className="mt-2 px-4 py-1.5 rounded-lg text-xs font-semibold border border-white/15 text-white/60 hover:text-white transition-all"
            >
              ✓ Mark as done
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orbitStatus?: Record<string, any> | null;
  stepStatuses?: Record<string, string>;
};

const STORAGE_KEY = "orbit_mvision_v1";

export function OrbitMarketingVision({ orbitStatus, stepStatuses = {} }: Props) {
  const [manualDone, setManualDone] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<"all" | "done" | "pending" | "auto" | "manual">("all");

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) setManualDone(JSON.parse(s));
    } catch {}
  }, []);

  const toggleDone = useCallback((id: string) => {
    setManualDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const { data: workbenchData } = useQuery({
    queryKey: ["/api/orbit/submission-workbench"],
    queryFn: async () => {
      const r = await authFetch("/api/orbit/submission-workbench");
      return r.ok ? r.json() : { items: [] };
    },
  });

  const isDone = (id: string) => {
    if (manualDone[id]) return true;
    return (workbenchData?.items ?? []).some(
      (row: { item: { checklistId: string }; status: string }) =>
        row.item?.checklistId === id && (row.status === "submitted" || row.status === "live"),
    );
  };

  const stepDone = (id: string) => stepStatuses[id] === "done";

  const s = orbitStatus ?? {};

  const items: MarketingItem[] = [
    // ── Technical ────────────────────────────────────────────────────────────
    {
      id: "tech-indexnow-key",
      label: "IndexNow key set up",
      description: "Automatically configured",
      kind: "auto",
      status: (s.indexNowKey as boolean) ? "done" : "running",
      icon: "🔑",
    },
    {
      id: "tech-indexnow-submitted",
      label: "URLs submitted via IndexNow",
      description: "Auto-runs weekly",
      kind: "auto",
      status: (s.indexNowSubmitted as boolean) ? "done" : "running",
      icon: "📡",
    },
    {
      id: "tech-sitemap",
      label: "Sitemap auto-generated",
      description: "svivva.com/sitemap.xml — always live",
      kind: "auto",
      status: "done",
      icon: "🗺️",
    },
    {
      id: "tech-gsc-sitemap",
      label: "Sitemap → Google Search Console",
      description: "Paste sitemap URL in GSC once",
      kind: "external",
      status: isDone("tech-gsc-sitemap") ? "done" : "pending",
      url: MANUAL_URLS["tech-gsc-sitemap"],
      icon: "🔍",
    },
    {
      id: "tech-schema-jsonld",
      label: "Schema.org JSON-LD on homepage",
      description: "Run svivva-schema in Orbit → copy output to <head>",
      kind: "mark",
      status: isDone("tech-schema-jsonld")
        ? "done"
        : stepDone("svivva-schema")
          ? "pending"
          : "pending",
      icon: "📋",
    },
    {
      id: "tech-rich-results",
      label: "Rich results test passed",
      description: "Verify at search.google.com/test/rich-results",
      kind: "external",
      status: isDone("tech-rich-results") ? "done" : "pending",
      url: MANUAL_URLS["tech-rich-results"],
      icon: "⭐",
    },

    // ── Content (auto) ────────────────────────────────────────────────────────
    {
      id: "content-seo-pages",
      label: `SEO landing pages (${(s.seoPages as number) ?? 0}/40)`,
      description: "Run 'SEO Pages' step in Orbit",
      kind: "auto",
      status:
        ((s.seoPages as number) ?? 0) >= 40
          ? "done"
          : ((s.seoPages as number) ?? 0) > 0
            ? "running"
            : "pending",
      icon: "📄",
    },
    {
      id: "content-blog",
      label: `Blog posts (${(s.blogPosts as number) ?? 0}/10)`,
      description: "Run 'SEO Blog Articles' step in Orbit",
      kind: "auto",
      status:
        ((s.blogPosts as number) ?? 0) >= 10
          ? "done"
          : ((s.blogPosts as number) ?? 0) > 0
            ? "running"
            : "pending",
      icon: "✍️",
    },
    {
      id: "content-comparisons",
      label: `Competitor comparisons (${(s.comparisons as number) ?? 0}/20)`,
      description: "Run 'Competitor Comparisons' in Orbit",
      kind: "auto",
      status:
        ((s.comparisons as number) ?? 0) >= 20
          ? "done"
          : ((s.comparisons as number) ?? 0) > 0
            ? "running"
            : "pending",
      icon: "⚔️",
    },
    {
      id: "content-aeo",
      label: `AEO / AI search pages (${(s.aeoPages as number) ?? 0}/15)`,
      description: "Run 'AI Search Optimization' in Orbit",
      kind: "auto",
      status:
        ((s.aeoPages as number) ?? 0) >= 15
          ? "done"
          : ((s.aeoPages as number) ?? 0) > 0
            ? "running"
            : "pending",
      icon: "🤖",
    },
    {
      id: "content-integrations",
      label: `Integration pages (${(s.integrationPages as number) ?? 0}/30)`,
      description: "Run '30 Integration Pages' in Orbit",
      kind: "auto",
      status:
        ((s.integrationPages as number) ?? 0) >= 30
          ? "done"
          : ((s.integrationPages as number) ?? 0) > 0
            ? "running"
            : "pending",
      icon: "🔗",
    },

    // ── Publishing — credential-based (auto-publish once keys added) ───────────
    {
      id: "manual-devto",
      label: "Dev.to article published",
      description: "Add API key → Orbit auto-publishes",
      kind: "credential",
      status: isDone("manual-devto") ? "done" : "needs_creds",
      credGroup: "devto",
      icon: "🟣",
    },
    {
      id: "manual-hashnode",
      label: "Hashnode article published",
      description: "Add API key → Orbit auto-publishes",
      kind: "credential",
      status: isDone("manual-hashnode") ? "done" : "needs_creds",
      credGroup: "hashnode",
      icon: "📰",
    },
    {
      id: "manual-twitter-thread",
      label: "Twitter/X launch thread",
      description: "Add API keys → Orbit posts thread",
      kind: "credential",
      status: isDone("manual-twitter-thread") ? "done" : "needs_creds",
      credGroup: "twitter",
      icon: "🐦",
    },
    {
      id: "manual-reddit-sideproject",
      label: "Reddit r/SideProject post",
      description: "Add credentials → Orbit posts",
      kind: "credential",
      status: isDone("manual-reddit-sideproject") ? "done" : "needs_creds",
      credGroup: "reddit",
      icon: "🔴",
    },
    {
      id: "manual-newsletters",
      label: "Newsletter pitches sent",
      description: "Add Resend key → Orbit emails TLDR, Ben's Bites, etc.",
      kind: "credential",
      status: isDone("manual-newsletters") ? "done" : "needs_creds",
      credGroup: "email",
      icon: "📧",
    },
    {
      id: "manual-podcasts",
      label: "Podcast pitches sent",
      description: "Add Resend key → Orbit sends pitches",
      kind: "credential",
      status: isDone("manual-podcasts") ? "done" : "needs_creds",
      credGroup: "email",
      icon: "🎙️",
    },

    // ── Truly manual ──────────────────────────────────────────────────────────
    {
      id: "manual-medium",
      label: "Medium article published",
      description: "Orbit generates draft → paste into Medium",
      kind: "external",
      status: isDone("manual-medium") ? "done" : "pending",
      url: "https://medium.com/new-story",
      icon: "🟢",
    },
    {
      id: "manual-showhn",
      label: "Show HN on Hacker News",
      description: "Needs personal founder account — no API",
      kind: "external",
      status: isDone("manual-showhn") ? "done" : "pending",
      url: MANUAL_URLS["manual-showhn"],
      icon: "🧡",
    },
    {
      id: "manual-producthunt",
      label: "Product Hunt launch",
      description: "Highest impact manual action — schedule carefully",
      kind: "external",
      status: isDone("manual-producthunt") ? "done" : "pending",
      url: MANUAL_URLS["manual-producthunt"],
      icon: "🚀",
    },
    {
      id: "manual-indiehackers",
      label: "Indie Hackers product listed",
      description: "Post a milestone story after first users",
      kind: "external",
      status: isDone("manual-indiehackers") ? "done" : "pending",
      url: MANUAL_URLS["manual-indiehackers"],
      icon: "🔨",
    },
    {
      id: "manual-gsc-indexing",
      label: "Key pages requested for Google indexing",
      description: "GSC → URL Inspection → Request indexing",
      kind: "external",
      status: isDone("manual-gsc-indexing") ? "done" : "pending",
      url: MANUAL_URLS["manual-gsc-indexing"],
      icon: "🕷️",
    },

    // ── Directories ───────────────────────────────────────────────────────────
    {
      id: "dir-futurepedia",
      label: "Futurepedia submitted",
      description: "500K/mo AI directory",
      kind: "external",
      status: isDone("dir-futurepedia") ? "done" : "pending",
      url: DIRECTORY_URLS["dir-futurepedia"],
      icon: "📚",
    },
    {
      id: "dir-taaft",
      label: "There's An AI For That",
      description: "2M/mo — top AI directory",
      kind: "external",
      status: isDone("dir-taaft") ? "done" : "pending",
      url: DIRECTORY_URLS["dir-taaft"],
      icon: "🤩",
    },
    {
      id: "dir-g2",
      label: "G2 listing created",
      description: "8M/mo B2B directory",
      kind: "external",
      status: isDone("dir-g2") ? "done" : "pending",
      url: DIRECTORY_URLS["dir-g2"],
      icon: "🏆",
    },
    {
      id: "dir-alternativeto",
      label: "AlternativeTo listed",
      description: "List as Zapier / Make alternative",
      kind: "external",
      status: isDone("dir-alternativeto") ? "done" : "pending",
      url: DIRECTORY_URLS["dir-alternativeto"],
      icon: "🔄",
    },
    {
      id: "dir-crunchbase",
      label: "Crunchbase company page",
      description: "Investor / press credibility",
      kind: "external",
      status: isDone("dir-crunchbase") ? "done" : "pending",
      url: DIRECTORY_URLS["dir-crunchbase"],
      icon: "🏢",
    },

    // ── Recurring ─────────────────────────────────────────────────────────────
    {
      id: "auto-sitemap-pings",
      label: "Weekly sitemap pings",
      description: "Auto-runs every 7 days",
      kind: "auto",
      status: "running",
      icon: "📶",
    },
    {
      id: "auto-growth-tasks",
      label: "Weekly growth tasks",
      description: "Growth Engine auto-runs in background",
      kind: "auto",
      status: "running",
      icon: "📈",
    },
  ].map((item) => ({
    ...item,
    status: item.status === "needs_creds" ? "pending" : item.status,
  })) as MarketingItem[];

  // recompute status based on isDone
  const resolved = items.map((item) => ({
    ...item,
    status: isDone(item.id)
      ? "done"
      : item.status === "done"
        ? "done"
        : item.kind === "credential"
          ? ("needs_creds" as StatusKind)
          : item.status,
  }));

  const doneCount = resolved.filter((i) => i.status === "done").length;
  const autoCount = resolved.filter((i) => i.kind === "auto").length;
  const needsCount = resolved.filter((i) => i.status === "needs_creds").length;
  const total = resolved.length;
  const pct = Math.round((doneCount / total) * 100);

  const filtered =
    filter === "all"
      ? resolved
      : filter === "done"
        ? resolved.filter((i) => i.status === "done")
        : filter === "pending"
          ? resolved.filter((i) => i.status !== "done" && i.kind !== "auto")
          : filter === "auto"
            ? resolved.filter((i) => i.kind === "auto")
            : resolved.filter(
                (i) => i.kind !== "auto" && i.status !== "done" && i.status !== "running",
              );

  return (
    <div className="flex flex-col gap-6">
      {/* ── Stats bar ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Progress ring + text */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="6"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke="#5BA8A0"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 163.4} 163.4`}
                  style={{ transition: "stroke-dasharray 0.6s ease" }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                {pct}%
              </span>
            </div>
            <div>
              <p className="text-white font-semibold text-lg">
                {doneCount}/{total} complete
              </p>
              <p className="text-white/40 text-xs">Marketing launch progress</p>
            </div>
          </div>

          {/* Pill stats */}
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {doneCount} done
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#5BA8A0]/10 text-[#5BA8A0] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              {autoCount} auto-running
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              {needsCount} need keys
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-white/50 flex items-center gap-1.5">
              <MousePointerClick className="w-3.5 h-3.5" />
              {total - doneCount - autoCount - needsCount} manual
            </span>
          </div>
        </div>
      </div>

      {/* ── Filter tabs ───────────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {(
          [
            ["all", "All", total],
            ["pending", "Action needed", total - doneCount - autoCount],
            ["auto", "Automated", autoCount],
            ["done", "Done", doneCount],
          ] as [typeof filter, string, number][]
        ).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === key
                ? "bg-[#5BA8A0] text-white"
                : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            {label} <span className="opacity-60">({count})</span>
          </button>
        ))}
      </div>

      {/* ── Legend ────────────────────────────────────────────────────────────── */}
      <div className="flex gap-4 flex-wrap text-xs text-white/35">
        <span className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-[#5BA8A0]" /> Auto-running
        </span>
        <span className="flex items-center gap-1.5">
          <Key className="w-3 h-3 text-amber-400" /> Add API key to activate
        </span>
        <span className="flex items-center gap-1.5">
          <MousePointerClick className="w-3 h-3 text-white/40" /> One-click manual
        </span>
        <span className="flex items-center gap-1.5">
          <CircleDot className="w-3 h-3 text-white/30" /> Mark as done
        </span>
      </div>

      {/* ── Item list ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <p className="text-center text-white/30 text-sm py-8">Nothing here 🎉</p>
        ) : (
          filtered.map((item) => <ItemCard key={item.id} item={item} onToggleDone={toggleDone} />)
        )}
      </div>
    </div>
  );
}
