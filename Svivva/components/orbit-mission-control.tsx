"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  Zap,
  Hand,
  Clock,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  Play,
  Key,
} from "lucide-react";
import { authFetch } from "@/hooks/use-auth";
import { getPublicSiteUrl } from "@/lib/site-url-public";

// ── types ─────────────────────────────────────────────────────────────────────

type TaskType = "auto" | "manual" | "credential";
type TaskStatus = "done" | "auto" | "manual" | "pending";

type TaskDef = {
  id: string;
  label: string;
  hint: string;
  type: TaskType;
  category: string;
  link?: string; // platform URL for manual tasks
  generateType?: string; // passed to generate-task-content API
  credentialHref?: string; // where to add credentials
  runStep?: string; // Orbit step key to run
};

// ── task definitions ──────────────────────────────────────────────────────────

function buildTasks(siteUrl: string): TaskDef[] {
  const gsc = "https://search.google.com/search-console";
  return [
    // ── Technical Foundation ─────────────────────────────────────────────────
    {
      id: "tech-indexnow",
      label: "IndexNow key + URL submission",
      hint: "Orbit auto-pings Google & Bing on every publish",
      type: "auto",
      category: "Technical",
      runStep: "svivva-indexnow",
    },
    {
      id: "tech-sitemap",
      label: "Sitemap auto-generated",
      hint: `${siteUrl}/sitemap.xml — always current`,
      type: "auto",
      category: "Technical",
    },
    {
      id: "tech-gsc-sitemap",
      label: "Sitemap submitted in Google Search Console",
      hint: "One-click: GSC → Sitemaps → paste URL → Submit",
      type: "manual",
      category: "Technical",
      link: `${gsc}/u/0/sitemaps`,
      generateType: "gsc-sitemap",
    },
    {
      id: "tech-schema-jsonld",
      label: "Schema.org JSON-LD on homepage",
      hint: "Run 'svivva-schema' in Orbit → copy output → paste in <head>",
      type: "manual",
      category: "Technical",
      link: `${siteUrl}/dashboard/launchpad`,
      generateType: "schema-jsonld",
    },
    {
      id: "tech-rich-results",
      label: "Rich results test passed",
      hint: "Google's tool confirms your structured data is valid",
      type: "manual",
      category: "Technical",
      link: `https://search.google.com/test/rich-results?url=${encodeURIComponent(siteUrl)}`,
      generateType: undefined,
    },
    {
      id: "tech-gsc-indexing",
      label: "Key pages requested for Google indexing",
      hint: "GSC URL Inspection → Request indexing for homepage + main features",
      type: "manual",
      category: "Technical",
      link: `${gsc}`,
      generateType: "gsc-indexing",
    },

    // ── AI Content (Orbit auto-creates) ──────────────────────────────────────
    {
      id: "content-seo-pages",
      label: "40 SEO landing pages",
      hint: "AI-written pages targeting high-intent keywords",
      type: "auto",
      category: "Content",
      runStep: "svivva-seo-pages",
    },
    {
      id: "content-blog",
      label: "10 SEO blog posts",
      hint: "Long-form articles built around target keywords",
      type: "auto",
      category: "Content",
      runStep: "svivva-blog",
    },
    {
      id: "content-comparisons",
      label: "20 competitor comparison pages",
      hint: "Svivva vs Zapier, Make, n8n — captures high-intent traffic",
      type: "auto",
      category: "Content",
      runStep: "svivva-comparisons",
    },
    {
      id: "content-aeo",
      label: "15 AEO pages for AI search",
      hint: "Answers for ChatGPT / Perplexity / Gemini to cite",
      type: "auto",
      category: "Content",
      runStep: "svivva-aeo",
    },
    {
      id: "content-integrations",
      label: "30 integration pages (Svivva + Tool)",
      hint: "Svivva + Notion, Slack, GitHub, Stripe, Supabase…",
      type: "auto",
      category: "Content",
      runStep: "svivva-integrations",
    },
    {
      id: "content-usecases",
      label: "20 industry use-case pages",
      hint: "Fintech, healthcare, e-commerce, SaaS…",
      type: "auto",
      category: "Content",
      runStep: "svivva-usecases",
    },
    {
      id: "content-paa",
      label: "15 People Also Ask pages",
      hint: "Dominate featured snippets and PAA boxes",
      type: "auto",
      category: "Content",
      runStep: "svivva-paa",
    },

    // ── Publishing (credential-gated auto) ───────────────────────────────────
    {
      id: "pub-devto",
      label: "Dev.to parasite article",
      hint: "API key → Orbit publishes automatically",
      type: "credential",
      category: "Publishing",
      credentialHref: "/dashboard/launchpad#autopilot",
      generateType: "devto-article",
    },
    {
      id: "pub-hashnode",
      label: "Hashnode article",
      hint: "API key → Orbit publishes automatically",
      type: "credential",
      category: "Publishing",
      credentialHref: "/dashboard/launchpad#autopilot",
      generateType: "hashnode-article",
    },
    {
      id: "pub-medium",
      label: "Medium article",
      hint: "Integration token → Orbit publishes automatically",
      type: "credential",
      category: "Publishing",
      credentialHref: "/dashboard/launchpad#autopilot",
      generateType: "medium-article",
    },
    {
      id: "pub-twitter",
      label: "Twitter/X launch thread",
      hint: "API keys → Orbit posts automatically",
      type: "credential",
      category: "Publishing",
      credentialHref: "/dashboard/launchpad#autopilot",
      generateType: "twitter-thread",
    },
    {
      id: "pub-reddit",
      label: "Reddit r/SideProject post",
      hint: "OAuth → Orbit posts automatically",
      type: "credential",
      category: "Publishing",
      credentialHref: "/dashboard/launchpad#autopilot",
      generateType: "reddit-post",
    },

    // ── Manual Publishing ─────────────────────────────────────────────────────
    {
      id: "man-showhn",
      label: "Show HN on Hacker News",
      hint: "Needs a real founder post — we generate the text",
      type: "manual",
      category: "Publishing",
      link: "https://news.ycombinator.com/submit",
      generateType: "showhn",
    },
    {
      id: "man-producthunt",
      label: "Product Hunt launch",
      hint: "Generates tagline + description — you submit",
      type: "manual",
      category: "Publishing",
      link: "https://www.producthunt.com/posts/new",
      generateType: "producthunt",
    },
    {
      id: "man-indiehackers",
      label: "Indie Hackers product listed",
      hint: "No public API — generates the pitch",
      type: "manual",
      category: "Publishing",
      link: "https://www.indiehackers.com/product/new",
      generateType: "indiehackers",
    },
    {
      id: "man-newsletters",
      label: "Newsletter pitches sent",
      hint: "TLDR AI, Ben's Bites, The Rundown — AI writes the pitch",
      type: "manual",
      category: "Publishing",
      link: "mailto:hi@tldr.tech",
      generateType: "newsletter-pitch",
    },
    {
      id: "man-podcasts",
      label: "Podcast pitches sent",
      hint: "AI founders podcasts — generates personalised pitch",
      type: "manual",
      category: "Publishing",
      generateType: "podcast-pitch",
    },

    // ── Directory Submissions ─────────────────────────────────────────────────
    {
      id: "dir-futurepedia",
      label: "Futurepedia listed (500K/mo)",
      hint: "One form + generated description",
      type: "manual",
      category: "Directories",
      link: "https://www.futurepedia.io/submit-tool",
      generateType: "directory-listing",
    },
    {
      id: "dir-taaft",
      label: "There's An AI For That (2M/mo)",
      hint: "Submit the tool listing",
      type: "manual",
      category: "Directories",
      link: "https://theresanaiforthat.com/submit/",
      generateType: "directory-listing",
    },
    {
      id: "dir-g2",
      label: "G2 listing (8M/mo)",
      hint: "Free listing — generates the description",
      type: "manual",
      category: "Directories",
      link: "https://sell.g2.com/",
      generateType: "directory-listing",
    },
    {
      id: "dir-alternativeto",
      label: "AlternativeTo listed",
      hint: "Positioned as Zapier alternative",
      type: "manual",
      category: "Directories",
      link: "https://alternativeto.net/add/",
      generateType: "directory-listing",
    },
    {
      id: "dir-crunchbase",
      label: "Crunchbase company page",
      hint: "Free — generates company description",
      type: "manual",
      category: "Directories",
      link: "https://www.crunchbase.com/add-new-organization",
      generateType: "directory-listing",
    },

    // ── Presence & Accounts ───────────────────────────────────────────────────
    {
      id: "acc-email-list",
      label: "Email list set up",
      hint: "Beehiiv or Substack — free tier is enough",
      type: "manual",
      category: "Presence",
      link: "https://app.beehiiv.com/signup",
      generateType: "welcome-email",
    },
    {
      id: "acc-pressrelease",
      label: "Press release submitted",
      hint: "EIN Presswire (free) — generates the release",
      type: "manual",
      category: "Presence",
      link: "https://www.einpresswire.com/",
      generateType: "press-release",
    },
    {
      id: "acc-poweredby",
      label: "'Powered by Svivva' on mini apps",
      hint: "Copy-paste badge snippet into your apps",
      type: "manual",
      category: "Presence",
      generateType: "powered-by-badge",
    },
  ];
}

type OrbitStatusSnapshot = {
  seoPages?: number;
  comparisons?: number;
  blogPosts?: number;
  aeoPages?: number;
  seedMarketing?: number;
  integrationPages?: number;
  usecasePages?: number;
  templatePages?: number;
  paaPages?: number;
  hubExists?: boolean;
  indexNowKey?: boolean;
  indexNowSubmitted?: boolean;
  stepCompletion?: Record<string, boolean>;
  preflight?: { indexHealthScore?: number };
};

/** Live completion from DB counts / indexing — avoids showing 0/31 when work is already done. */
function orbitAutoDone(taskId: string, os?: OrbitStatusSnapshot): boolean {
  if (!os) return false;
  switch (taskId) {
    case "tech-indexnow":
      return !!(os.indexNowKey && os.indexNowSubmitted);
    case "tech-sitemap":
    case "tech-schema-jsonld":
      return true;
    case "tech-gsc-indexing":
      return (os.preflight?.indexHealthScore ?? 0) >= 80 || !!os.indexNowSubmitted;
    case "content-seo-pages":
      return (os.seoPages ?? 0) >= 20;
    case "content-blog":
      return (os.blogPosts ?? 0) >= 10;
    case "content-comparisons":
      return (os.comparisons ?? 0) >= 8;
    case "content-aeo":
      return (os.aeoPages ?? 0) >= 10;
    case "content-integrations":
      return (os.integrationPages ?? 0) >= 20;
    case "content-usecases":
      return (os.usecasePages ?? 0) >= 15;
    case "content-paa":
      return (os.paaPages ?? 0) >= 10;
    case "acc-poweredby":
      return (os.seedMarketing ?? 0) >= 20;
    default:
      return false;
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "orbit_mc_done_v1";

const CATEGORY_ORDER = ["Technical", "Content", "Publishing", "Directories", "Presence"];

const CAT_COLORS: Record<string, string> = {
  Technical: "#5BA8A0",
  Content: "#7c5cbf",
  Publishing: "#e06c75",
  Directories: "#d19a66",
  Presence: "#56b6c2",
};

function statusBadge(status: TaskStatus) {
  switch (status) {
    case "done":
      return (
        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
          <CheckCircle2 className="w-3 h-3" /> DONE
        </span>
      );
    case "auto":
      return (
        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/25">
          <Zap className="w-3 h-3" /> ORBIT
        </span>
      );
    case "manual":
      return (
        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
          <Hand className="w-3 h-3" /> DO NOW
        </span>
      );
    case "pending":
      return (
        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/10">
          <Clock className="w-3 h-3" /> PENDING
        </span>
      );
  }
}

// ── action drawer ─────────────────────────────────────────────────────────────

function ActionDrawer({
  task,
  onClose,
  onDone,
}: {
  task: TaskDef;
  onClose: () => void;
  onDone: (id: string) => void;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    if (!task.generateType) return;
    setGenerating(true);
    try {
      const res = await authFetch(
        `/api/orbit/generate-task-content?type=${encodeURIComponent(task.generateType)}`,
      );
      const data = await res.json();
      setContent(data.content ?? "Content generation failed — please try again.");
    } catch {
      setContent("Could not reach the AI — check your Orbit API key in Runtime Keys.");
    } finally {
      setGenerating(false);
    }
  }, [task.generateType]);

  useEffect(() => {
    if (task.generateType) void generate();
  }, [generate, task.generateType]);

  const copy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const markDone = () => {
    onDone(task.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-white/8">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">
              {task.category}
            </p>
            <h3 className="text-base font-semibold text-white">{task.label}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-white/8 transition-colors text-white/40 hover:text-white/70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Generated content */}
        {task.generateType && (
          <div className="px-6 py-4">
            {generating ? (
              <div className="flex items-center gap-2 text-white/40 text-sm py-6 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating with AI…
              </div>
            ) : content ? (
              <div className="relative">
                <pre className="text-xs text-white/70 bg-white/4 border border-white/8 rounded-xl p-4 whitespace-pre-wrap font-mono leading-relaxed max-h-56 overflow-y-auto">
                  {content}
                </pre>
                <button
                  onClick={copy}
                  className="absolute top-2.5 right-2.5 flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-md bg-white/8 hover:bg-white/14 text-white/50 hover:text-white/80 transition-all border border-white/10"
                >
                  <Copy className="w-3 h-3" />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            ) : null}
          </div>
        )}

        {!task.generateType && <div className="px-6 py-4 text-sm text-white/45">{task.hint}</div>}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 px-6 pb-6">
          {task.link && (
            <a
              href={task.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#5BA8A0,#6B2C4A)" }}
            >
              Open Platform
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {task.credentialHref && (
            <a
              href={task.credentialHref}
              className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-all"
            >
              <Key className="w-3.5 h-3.5" />
              Add Credentials
            </a>
          )}
          <button
            onClick={markDone}
            className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/8 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mark Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

type Props = {
  orbitStatus?: Record<string, unknown>;
  stepStatuses?: Record<string, "pending" | "running" | "done" | "error">;
};

type FilterType = "all" | "auto" | "manual" | "done";

export function OrbitMissionControl({ orbitStatus = {}, stepStatuses = {} }: Props) {
  const siteUrl = getPublicSiteUrl();
  const tasks = buildTasks(siteUrl);
  const os = orbitStatus as OrbitStatusSnapshot;

  const [done, setDone] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<FilterType>("all");
  const [activeTask, setActiveTask] = useState<TaskDef | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Load saved "done" state from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      setDone(saved);
    } catch {}
  }, []);

  const markDone = (id: string) => {
    setDone((prev) => {
      const next = { ...prev, [id]: true };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  // Compute status for each task
  const getStatus = (task: TaskDef): TaskStatus => {
    if (done[task.id]) return "done";
    if (orbitAutoDone(task.id, os)) return "done";
    if (task.type === "auto") {
      const step = task.runStep;
      if (!step) return "auto";
      if (stepStatuses[step] === "done" || os.stepCompletion?.[step]) return "done";
      return stepStatuses[step] === "running" ? "auto" : "pending";
    }
    if (task.type === "credential") return "manual";
    return "manual";
  };

  // Stats
  const statuses = tasks.map(getStatus);
  const doneCount = statuses.filter((s) => s === "done").length;
  const total = tasks.length;
  const autoCount = tasks.filter((t) => t.type === "auto").length;
  const manualLeft = tasks.filter((t, i) => statuses[i] === "manual").length;
  const pct = Math.round((doneCount / total) * 100);

  // Filter
  const visible = tasks.filter((t) => {
    const s = getStatus(t);
    if (filter === "auto") return t.type === "auto" && s !== "done";
    if (filter === "manual")
      return (t.type === "manual" || t.type === "credential") && s !== "done";
    if (filter === "done") return s === "done";
    return true;
  });

  // Group by category
  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    tasks: visible.filter((t) => t.category === cat),
  })).filter((g) => g.tasks.length > 0);

  const toggleCat = (cat: string) => setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <div className="w-full space-y-6">
      {/* ── Progress bar ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/8 bg-white/3 px-6 py-5 flex flex-col sm:flex-row items-center gap-6">
        {/* Ring */}
        <div className="relative flex-shrink-0">
          <svg width={88} height={88} viewBox="0 0 88 88">
            <circle
              cx={44}
              cy={44}
              r={36}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={8}
            />
            <circle
              cx={44}
              cy={44}
              r={36}
              fill="none"
              stroke="url(#ring-grad)"
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - pct / 100)}`}
              transform="rotate(-90 44 44)"
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
            <defs>
              <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#5BA8A0" />
                <stop offset="100%" stopColor="#6B2C4A" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-white">{pct}%</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-1 text-center sm:text-left">
          <p className="text-lg font-semibold text-white">
            {doneCount} of {total} complete
          </p>
          <p className="text-sm text-white/40">
            {autoCount} automated by Orbit &nbsp;·&nbsp; {manualLeft} manual tasks remaining
          </p>
          <div className="w-full h-1.5 rounded-full bg-white/6 mt-3 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg,#5BA8A0,#6B2C4A)",
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="flex sm:flex-col gap-3 text-xs flex-shrink-0">
          {[
            { color: "bg-teal-400", label: "Orbit auto" },
            { color: "bg-amber-400", label: "Manual" },
            { color: "bg-emerald-400", label: "Done" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-white/40">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter tabs ───────────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "auto", "manual", "done"] as FilterType[]).map((f) => {
          const labels: Record<FilterType, string> = {
            all: "All tasks",
            auto: "🤖 Automated",
            manual: "👆 Manual",
            done: "✅ Done",
          };
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                filter === f
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-transparent border-white/8 text-white/40 hover:text-white/60 hover:border-white/15"
              }`}
            >
              {labels[f]}
            </button>
          );
        })}
      </div>

      {/* ── Task groups ───────────────────────────────────────────────────────── */}
      {grouped.map(({ cat, tasks: catTasks }) => {
        const isCollapsed = collapsed[cat];
        const catColor = CAT_COLORS[cat] ?? "#aaa";
        const doneCat = catTasks.filter((t) => getStatus(t) === "done").length;

        return (
          <div key={cat} className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden">
            {/* Category header */}
            <button
              onClick={() => toggleCat(cat)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: catColor }}
                />
                <span className="font-semibold text-white text-sm">{cat}</span>
                <span className="text-xs text-white/30">
                  {doneCat}/{catTasks.length} done
                </span>
              </div>
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4 text-white/30" />
              ) : (
                <ChevronUp className="w-4 h-4 text-white/30" />
              )}
            </button>

            {/* Tasks */}
            {!isCollapsed && (
              <div className="divide-y divide-white/5">
                {catTasks.map((task) => {
                  const s = getStatus(task);
                  const rowBg =
                    s === "done"
                      ? "bg-emerald-500/4"
                      : s === "auto" || (task.type === "auto" && s === "pending")
                        ? "bg-teal-500/3"
                        : "bg-amber-500/3";

                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-4 px-5 py-3.5 ${rowBg} transition-colors`}
                    >
                      {/* Status dot */}
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            s === "done"
                              ? "#34d399"
                              : s === "auto"
                                ? "#5BA8A0"
                                : s === "manual"
                                  ? "#fbbf24"
                                  : "rgba(255,255,255,0.12)",
                        }}
                      />

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${s === "done" ? "text-white/50 line-through" : "text-white/85"}`}
                        >
                          {task.label}
                        </p>
                        <p className="text-xs text-white/30 truncate mt-0.5">{task.hint}</p>
                      </div>

                      {/* Badge */}
                      <div className="flex-shrink-0">{statusBadge(s)}</div>

                      {/* Action button */}
                      <div className="flex-shrink-0">
                        {s === "done" ? (
                          <button
                            onClick={() => {
                              setDone((prev) => {
                                const next = { ...prev };
                                delete next[task.id];
                                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                                return next;
                              });
                            }}
                            className="text-[11px] text-white/20 hover:text-white/50 transition-colors px-2 py-1"
                          >
                            undo
                          </button>
                        ) : task.type === "auto" ? (
                          <button
                            onClick={() => markDone(task.id)}
                            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-500/20 text-teal-400/70 hover:bg-teal-500/8 transition-all"
                          >
                            <Play className="w-3 h-3" /> Run in Orbit
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveTask(task)}
                            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white font-medium transition-all hover:opacity-90"
                            style={{ background: "linear-gradient(135deg,#5BA8A0,#6B2C4A)" }}
                          >
                            Do Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {grouped.length === 0 && (
        <div className="text-center py-16 text-white/25 text-sm">
          {filter === "done"
            ? "No tasks marked done yet — complete some tasks above!"
            : "All tasks in this filter are done 🎉"}
        </div>
      )}

      {/* ── Action drawer ─────────────────────────────────────────────────────── */}
      {activeTask && (
        <ActionDrawer task={activeTask} onClose={() => setActiveTask(null)} onDone={markDone} />
      )}
    </div>
  );
}
