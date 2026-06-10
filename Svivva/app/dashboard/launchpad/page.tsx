"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
const FeatureThreeBg = dynamic(
  () =>
    import("@/components/feature-three-background").then((m) => ({
      default: m.FeatureThreeBackground,
    })),
  { ssr: false },
);
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Rocket,
  CheckCircle2,
  Circle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  Globe,
  FileText,
  MessageSquare,
  Package,
  Link2,
  Activity,
  Sparkles,
  Play,
  RotateCcw,
  ExternalLink,
  ListChecks,
  ArrowRight,
  Search,
  Eye,
  Copy,
  Target,
  Wand2,
  Info,
  Radar,
  TrendingUp,
} from "lucide-react";
import { ConnectionsHub } from "@/components/connections-hub";
import { OrbitGrowthIntelligence } from "@/components/orbit-growth-intelligence";
import OrbitCausalAttribution from "@/components/orbit-causal-attribution";
import { INDEX22_PHASE_COUNT, SEO_INDEX_PHASES } from "@/lib/orbit/seo-index-phases.client";
import { buildIndex22OrbitSteps } from "@/lib/orbit/seo-index-steps-ui";
import { OrbitStripeSetup } from "@/components/orbit-stripe-setup";
import { MarketingChecklist } from "@/components/marketing-checklist";
import { OrbitMarketingAutopilot } from "@/components/orbit-marketing-autopilot";
import { OrbitMarketingVision } from "@/components/orbit-marketing-vision";
import { usePublicOrbitUrls } from "@/hooks/use-public-orbit-urls";
import { getClutetyOrbitPreset } from "@/lib/workspace-external-apps";
import { getAutoCompletableManualKeys } from "@/lib/orbit/manual-checklist-auto";

const TEAL = "#5BA8A0";
const BURG = "#6B2C4A";
const CHUNK_SIZE = 15;

type StepStatus = "pending" | "running" | "done" | "error";

interface DiscoveredTool {
  name: string;
  url: string;
  description: string;
}

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  estimate?: string;
  needsTools?: boolean;
  auto?: string[]; // what runs automatically
  manual?: string[]; // what you must do yourself after
}

type OrbitUrlPack = { site: string; host: string; sitemap: string };

function makeSvivvaSteps(orbit: OrbitUrlPack): Step[] {
  const { site, host, sitemap } = orbit;
  return [
    {
      id: "svivva-indexnow",
      title: "Set Up IndexNow",
      icon: Zap,
      estimate: "~5s",
      description:
        "Generate key + submit all URLs to Bing, Yandex & Yahoo instantly — skips waiting for Googlebot by weeks",
      auto: [
        "IndexNow key generated & saved to database",
        "All site URLs submitted to Bing, Yandex, Yahoo, DuckDuckGo",
      ],
      manual: [
        `Open Google Search Console → Sitemaps → paste: ${sitemap} → click Submit`,
        "Google does NOT use IndexNow — GSC sitemap submission is the only way to guarantee Google crawls you",
      ],
    },
    {
      id: "svivva-seo-pages",
      title: "40 SEO Landing Pages",
      icon: Globe,
      estimate: "~4 min",
      description:
        "AI-written pages for 40 high-traffic keywords — 'chatgpt api integration', 'openai api tutorial', 'build app with chatgpt' + 37 more",
      auto: [
        `Up to 40 keyword pages created at ${host}/{slug} (skips any already created)`,
        "Each page has title, meta description, and content",
        "Pages auto-submitted to Bing/Yahoo/Yandex via IndexNow",
      ],
      manual: [
        "In Google Search Console → URL Inspection → paste each page URL → click Request Indexing",
        "Pages are live but Google won't know until you request indexing",
      ],
    },
    {
      id: "svivva-comparisons",
      title: "20 Competitor Comparisons",
      icon: Activity,
      estimate: "~3 min",
      description:
        "Svivva vs n8n, LangChain, Dify, Supabase, Firebase + 15 more — captures high-converting 'X alternative' searches",
      auto: [
        "Up to 20 comparison pages created (svivva-vs-langchain, svivva-vs-n8n, etc.)",
        "Pages submitted to Bing/Yahoo/Yandex via IndexNow",
      ],
      manual: [
        "Request indexing in Google Search Console for each comparison page",
        "Share on Reddit (r/nocode, r/webdev) for extra backlinks — drafts are in the results below",
      ],
    },
    {
      id: "svivva-blog",
      title: "10 SEO Blog Articles",
      icon: FileText,
      estimate: "~3 min",
      description:
        "Full-length technical posts on LLM endpoints, schema enforcement, prompt engineering — ranks for long-tail developer searches",
      auto: [
        `10 blog posts written, published, and live at ${site}/blog`,
        "Each post has meta title, description, and full HTML content",
      ],
      manual: [
        "Request indexing in Google Search Console for each post",
        "Share top 2-3 posts on LinkedIn and Twitter/X — copy the content from Results below",
      ],
    },
    {
      id: "svivva-directories",
      title: "100+ Directory Submissions",
      icon: ListChecks,
      estimate: "~30s",
      description:
        "Listing content for Futurepedia, TAAFT, Product Hunt, G2, AlternativeTo, SaaSHub, RapidAPI + 90+ more",
      auto: [
        "100+ directory listing texts generated (name, tagline, description, categories, screenshots list)",
      ],
      manual: [
        "Copy each listing from Results and paste it into the actual directory website",
        "Priority order: Product Hunt → G2 → Futurepedia → AlternativeTo → SaaSHub → the rest",
        "These cannot be auto-submitted — each site requires a manual account sign-up",
      ],
    },
    {
      id: "svivva-parasite",
      title: "Parasite SEO Articles",
      icon: FileText,
      estimate: "~2 min",
      description:
        "5 platform-native articles for Dev.to (DA 94), Medium (DA 96), Hashnode, HackerNoon, Substack",
      auto: ["5 full articles written with correct formatting for each platform"],
      manual: [
        "Copy each article from Results and publish it on the target platform",
        "Dev.to: dev.to/new → paste → publish",
        "Medium: medium.com/new-story → paste → publish",
        "These cannot be auto-posted — platforms require a logged-in account",
      ],
    },
    {
      id: "svivva-aeo",
      title: "AI Search Optimization",
      icon: Search,
      estimate: "~2 min",
      description:
        "15 answer-format pages targeting Perplexity, ChatGPT Search, Gemini — AI engines cite your pages",
      auto: [
        `15 AEO pages created at ${host}/{slug} with direct-answer format`,
        "Submitted to Bing/Yahoo/Yandex via IndexNow",
      ],
      manual: [
        "Request indexing in Google Search Console for each AEO page",
        "Perplexity and ChatGPT pick these up automatically once Google indexes them — no extra action needed",
      ],
    },
    {
      id: "svivva-communities",
      title: "Community Strategy Pack",
      icon: MessageSquare,
      estimate: "~30s",
      description:
        "8 Reddit posts + Show HN + IH milestone post + Discord templates — written, formatted, ready to paste",
      auto: ["All post drafts generated with platform-specific formatting"],
      manual: [
        "Copy each post from Results and submit it to the platform",
        "Reddit: post to r/SideProject first (most traffic) — do NOT post to multiple subreddits at once or you'll be shadowbanned",
        "Show HN: submit to news.ycombinator.com/submit — best time is 9am–12pm EST on weekdays",
      ],
    },
    {
      id: "svivva-outreach",
      title: "PR & Newsletter Pitches",
      icon: Sparkles,
      estimate: "~45s",
      description: "Press release + pitches for 10 AI/dev newsletters + 8 podcast pitches",
      auto: [
        "Press release written",
        "10 newsletter pitch emails written",
        "8 podcast pitch emails written",
      ],
      manual: [
        "Send each email manually from your own inbox",
        "Copy the email from Results → paste into Gmail/Outlook → send",
        "Best time to send: Tuesday or Wednesday, 8–10am recipient's time zone",
      ],
    },
    {
      id: "svivva-schema",
      title: "Schema.org + Backlink Bait",
      icon: Link2,
      estimate: "~30s",
      description:
        "FAQ + SoftwareApplication JSON-LD for rich results · Roundup page attracts natural links",
      auto: [
        "FAQ schema JSON-LD generated",
        "SoftwareApplication schema generated",
        "'Top developer AI tools' roundup page created",
      ],
      manual: [
        "Add the JSON-LD from Results to your homepage <head> in the site code",
        "Test at: search.google.com/test/rich-results → paste your URL → check for errors",
      ],
    },
    {
      id: "svivva-social",
      title: "Full Social Launch Pack",
      icon: Rocket,
      estimate: "~20s",
      description:
        "Twitter/X thread · LinkedIn article · Reddit posts · Product Hunt · Show HN — all written, ready to post",
      auto: [
        "Twitter/X thread written (hook tweet + 8 replies)",
        "LinkedIn article written",
        "Product Hunt listing text written",
      ],
      manual: [
        "Copy and post the Twitter thread from Results — post the hook tweet first, then reply with each numbered tweet",
        "Schedule LinkedIn post for Tuesday 8–10am for best reach",
        "Submit Product Hunt listing at 12:01am PST for maximum upvote time",
      ],
    },
    {
      id: "svivva-submit",
      title: "Submit Everywhere (Google + Bing)",
      icon: Activity,
      estimate: "~30s",
      description:
        "IndexNow + Bing ping + Google Search Console sitemap API (when credentials saved at /dashboard/gsc-connect)",
      auto: [
        "All URLs submitted to Bing, Yandex, Yahoo via IndexNow",
        "Bing sitemap pinged",
        "GSC sitemap registered via API when service account is configured",
        "Google Indexing API nudge for first batches of URLs (optional)",
      ],
      manual: [
        "One-time: /dashboard/gsc-connect — paste GSC service account JSON and add that email as Owner in Search Console",
        `Verify sitemap in GSC → Sitemaps: ${sitemap}`,
      ],
    },
    {
      id: "svivva-integrations",
      title: "30 Integration Pages",
      icon: Link2,
      estimate: "~6 min",
      description:
        "AI-written 'Svivva + [Tool]' pages for Notion, Slack, GitHub, Stripe, Supabase, Shopify + 24 more — targets zero-competition 'tool + AI backend' searches",
      auto: [
        `30 integration guide pages created at ${host}/{slug}`,
        "Each covers: how to connect the tool, step-by-step guide, use cases, getting started CTA",
        "All submitted to Bing/Yandex/Yahoo via IndexNow",
      ],
      manual: [
        "Request indexing in GSC for each integration page",
        "Share the most relevant ones in communities for those tools (e.g. Notion subreddit, Shopify forums)",
      ],
    },
    {
      id: "svivva-usecases",
      title: "20 Industry Use Case Pages",
      icon: Target,
      estimate: "~4 min",
      description:
        "AI-written pages for Healthcare, Fintech, E-commerce, Legal Tech + 16 more industries — targets 'AI backend for [industry]' searches from decision-makers",
      auto: [
        "20 industry-specific use case pages created",
        "Each explains the problem → AI solution → 5 specific use cases → CTA",
        "All submitted to IndexNow",
      ],
      manual: [
        "Request indexing in GSC for each use case page",
        "Share in industry-specific LinkedIn groups and newsletters for extra reach",
      ],
    },
    {
      id: "svivva-templates",
      title: "25 API Template Pages",
      icon: FileText,
      estimate: "~5 min",
      description:
        "Developer-focused template pages for Sentiment Analysis, Chatbot, Invoice Parser, Resume Parser + 21 more — each with code examples, targets 'build X API' searches",
      auto: [
        "25 API template pages created with working JSON examples",
        "Targets developers searching for specific use-case implementations",
        "All submitted to IndexNow",
      ],
      manual: [
        "Request indexing in GSC",
        "Share on developer communities: Reddit r/webdev, Dev.to, Hacker News",
      ],
    },
    {
      id: "svivva-paa",
      title: "People Also Ask Domination",
      icon: Search,
      estimate: "~3 min",
      description:
        "15 pages each answering an exact 'People Also Ask' question — gets featured in Google PAA boxes AND cited by Perplexity/ChatGPT/Gemini",
      auto: [
        "15 question-answer pages created (e.g. 'What is the best way to ship AI features fast?')",
        "First paragraph is the direct answer — what Google shows in PAA boxes",
        "Also optimized for AI search engine citations",
        "All submitted to IndexNow",
      ],
      manual: [
        "Request indexing in GSC for each question page",
        "These pages work on autopilot — Google and AI engines surface them for matching queries",
      ],
    },
    {
      id: "svivva-growth-intelligence",
      title: "Growth Intelligence Daily Report",
      icon: TrendingUp,
      estimate: "~5s",
      description:
        "8-system demand scanner — pains, questions, competitor weaknesses, content/tool/trend opportunities scored ≥80/100. Open the Growth Intel tab for the full dashboard.",
      auto: [
        "Pain Miner · Competitor Radar · Question Engine · Content Arbitrage",
        "Community Gap · Free Tool Discovery · Trend Detector · GEO Optimization",
        "P0 priority queue saved to growth_tasks",
      ],
      manual: [
        "Open the Growth Intel tab to review ranked opportunities",
        "Execute top P0 items (calculator, comparisons, llms.txt) from the queue",
      ],
    },
  ];
}

function makeFusionSteps(): Step[] {
  // Fusion steps are planned but not yet implemented in the backend.
  // Return empty to avoid "Unknown stepId" errors.
  return [];
}

function makeMiniSteps(orbit: OrbitUrlPack): Step[] {
  const { site, host } = orbit;
  return [
    {
      id: "mini-import",
      title: `Build SEO Pages on ${host}`,
      icon: Globe,
      estimate: "~30s/5 tools",
      description: `Auto-discovers all tools from your connected app, then creates 4 keyword pages per tool on ${host}`,
      auto: [
        "Fetches tool list from your app URL automatically",
        "Creates 4 SEO pages per tool (feature, use-case, integration, how-to)",
        "Each page has H1, meta description, canonical, and FAQ schema",
      ],
      manual: [
        "Review generated pages and edit content to match your brand",
        "Add custom images or screenshots to tool pages",
        "Adjust keyword targeting if needed",
      ],
    },
    {
      id: "mini-hub",
      title: "Build Hub & Category Pages",
      icon: Package,
      estimate: "~20s",
      description: `Master hub page + 6 category pages on ${host} — gives Google site structure so tool pages rank faster`,
      auto: [
        `Hub page created at ${site}/tools`,
        "6 category pages created (encryption, password, network, web, file, system)",
      ],
      manual: [
        `Request indexing in GSC for ${site}/tools and each category page`,
        "Hub page is the anchor — Google uses it to find and rank all tool pages faster",
      ],
    },
    {
      id: "mini-embed",
      title: "Generate 'Powered by Svivva' Widget",
      icon: Link2,
      estimate: "~20s",
      needsTools: true,
      description: "Creates a ready-to-paste banner + footer + post-use CTA for EACH mini app",
      auto: [
        "Widget HTML + CSS generated for each tool",
        "Banner, footer, and post-use CTA all written",
      ],
      manual: [
        "Copy each widget from Results and paste it into the corresponding app's HTML",
        "Add the banner to the top of the page and the footer CTA at the bottom",
        "Redeploy your app after adding the widgets for them to go live",
      ],
    },
    {
      id: "mini-social",
      title: "Social Launch Pack",
      icon: Sparkles,
      estimate: "~20s",
      description:
        "Twitter/X thread · LinkedIn · Reddit posts · Show HN — all written using your specific tool names",
      auto: [
        "Twitter/X launch thread written for your tool set",
        "LinkedIn post written",
        "Reddit posts drafted for relevant subreddits",
      ],
      manual: [
        "Post the Twitter thread — send the hook first, reply with each numbered tweet",
        "Post to Reddit: r/netsec, r/cybersecurity, r/privacy (one at a time, not all at once)",
        "Best time: Tuesday–Thursday, 9–11am EST",
      ],
    },
    {
      id: "mini-cname",
      title: "Set Up All 3 Subdomains",
      icon: Activity,
      estimate: "~5s",
      description:
        "Auto-creates apps.svivva.com, security.svivva.com (→ /cyber-security-mini-apps) via GoDaddy API",
      auto: ["GoDaddy DNS CNAME records added for all 3 subdomains (if GoDaddy API key is set)"],
      manual: [
        "Wait 24–48 hours for DNS propagation before the subdomains resolve",
        "Test after 24h: open apps.svivva.com in a browser — if it loads your hosted app you're done",
        "If GoDaddy API failed: go to GoDaddy DNS Manager → add CNAME records manually (details in Results below)",
      ],
    },
    {
      id: "mini-index",
      title: "Index Everything (Google + Bing)",
      icon: Zap,
      estimate: "~30s",
      description: "IndexNow + Bing + GSC sitemap API for all mini-app SEO pages, hubs, and /tools",
      auto: [
        "All tool + hub URLs via IndexNow (Bing, Yandex, Yahoo, DuckDuckGo)",
        "GSC sitemap registration when service account is saved",
        "Curated traffic-safe tools only on import (native Svivva utilities prioritized)",
      ],
      manual: [
        "Connect Google once: /dashboard/gsc-connect (service account as GSC Owner)",
        `Confirm in GSC → Sitemaps: ${site}/sitemap.xml shows Success`,
      ],
    },
  ];
}

const CLUTETY_PRESET = getClutetyOrbitPreset();

/** Every mini-app hub Orbit scans to build svivva.com SEO pages */
const ORBIT_HUB_URLS = [
  CLUTETY_PRESET.miniAppsUrl,
  "https://svivva.com/ai-tools-hub",
  "https://svivva.com/cyber-security-mini-apps",
  "https://svivva.com/seo-pack",
  CLUTETY_PRESET.sourceUrl,
];

const STORAGE_KEY = "orbit_v3";
/** Checked-off items in the pink “Your turn” manual checklist (local only). */
const MANUAL_DONE_KEY = "orbit_manual_check_v1";
/** Gold “Run Everything” runs all 8 phases in one session (serverless-safe batches). */
const GOLD_PHASE_KEY = "orbit_gold_phase_v2";
const GOLD_MARKETING_PHASES = 8;
const INDEX22_STEPS = buildIndex22OrbitSteps();
/** Index 22 (9) + marketing autopilot (8) */
const GOLD_PHASES = INDEX22_PHASE_COUNT + GOLD_MARKETING_PHASES;

type OrbitState = {
  statuses: Record<string, StepStatus>;
  results: Record<string, string>;
};

function loadStateLocal(): OrbitState {
  if (typeof window === "undefined") return { statuses: {}, results: {} };
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || { statuses: {}, results: {} };
  } catch {
    return { statuses: {}, results: {} };
  }
}

async function loadStateFromServer(): Promise<OrbitState | null> {
  try {
    const r = await fetch("/api/orbit/admin-state");
    if (!r.ok) return null;
    const data = await r.json();
    if (data.statuses && Object.keys(data.statuses).length > 0) return data as OrbitState;
    return null;
  } catch {
    return null;
  }
}

function saveState(s: Record<string, StepStatus>, r: Record<string, string>) {
  const payload = { statuses: s, results: r };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /**/
  }
  // Sync to backend (fire-and-forget) so state persists across devices
  fetch("/api/orbit/admin-state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

interface ReplItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  url: string;
  imageUrl?: string;
}

// ── Multi-App connector ────────────────────────────────────────────────────
interface AppEntry {
  id: string;
  name: string;
  url: string;
}
type ScanStatus = "idle" | "scanning" | "found" | "single" | "error";

function MiniSourceConfig({
  sourceUrl,
  setSourceUrl,
  discoveredTools,
  setDiscoveredTools,
  savedUrl,
}: {
  sourceUrl: string;
  setSourceUrl: (u: string) => void;
  discoveredTools: DiscoveredTool[];
  setDiscoveredTools: (t: DiscoveredTool[]) => void;
  savedUrl?: string | null;
}) {
  const isConnected = discoveredTools.length > 0;

  const [entries, setEntries] = useState<AppEntry[]>([
    { id: crypto.randomUUID(), name: "", url: "" },
  ]);
  const [scanStatuses, setScanStatuses] = useState<Record<string, ScanStatus>>({});
  const [scanCounts, setScanCounts] = useState<Record<string, number>>({});
  const [scanning, setScanning] = useState(false);
  const [urlsSaved, setUrlsSaved] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-populate from saved data when it loads — supports JSON [{name,url}] or legacy comma-sep URLs
  useEffect(() => {
    if (!savedUrl) return;
    if (!(entries.length === 1 && !entries[0].url)) return;
    try {
      const parsed: { name: string; url: string }[] = JSON.parse(savedUrl);
      if (Array.isArray(parsed) && parsed.length) {
        setEntries(
          parsed.map((e) => ({ id: crypto.randomUUID(), name: e.name || "", url: e.url || "" })),
        );
        return;
      }
    } catch {
      /* not JSON — fall through to comma-sep */
    }
    const urls = savedUrl
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);
    if (urls.length) setEntries(urls.map((url) => ({ id: crypto.randomUUID(), name: "", url })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedUrl]);

  // Auto-save entries (name + url) to DB 800ms after any change
  const persistEntries = (updated: AppEntry[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const filled = updated.filter((e) => e.url.trim());
      if (!filled.length) return;
      const payload = JSON.stringify(
        filled.map((e) => ({ name: e.name.trim(), url: e.url.trim().replace(/\/$/, "") })),
      );
      try {
        await authFetch("/api/seeds/credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ miniAppsUrl: payload }),
        });
        setUrlsSaved(true);
        setTimeout(() => setUrlsSaved(false), 2500);
      } catch {
        /* non-critical */
      }
    }, 800);
  };

  const addEntry = () => {
    const updated: AppEntry[] = [...entries, { id: crypto.randomUUID(), name: "", url: "" }];
    setEntries(updated);
  };

  const removeEntry = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    persistEntries(updated);
  };

  const updateEntry = (id: string, field: "name" | "url", value: string) => {
    const updated = entries.map((e) => (e.id === id ? { ...e, [field]: value } : e));
    setEntries(updated);
    persistEntries(updated);
  };

  // Scan each app URL via discover-tools API, then merge all tools
  const scanAndConnect = async () => {
    const valid = entries.filter((e) => e.url.trim());
    if (!valid.length) return;
    setScanning(true);

    const allTools: DiscoveredTool[] = [];

    for (const entry of valid) {
      const cleanUrl = entry.url.trim().replace(/\/$/, "");
      setScanStatuses((p) => ({ ...p, [entry.id]: "scanning" }));

      try {
        const res = await authFetch("/api/orbit/discover-tools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ replUrl: cleanUrl }),
        });
        const data = await res.json();

        if (data.tools?.length) {
          allTools.push(...data.tools);
          setScanStatuses((p) => ({ ...p, [entry.id]: "found" }));
          setScanCounts((p) => ({ ...p, [entry.id]: data.tools.length }));
        } else {
          // fallback: use entry name → page title from API → hostname
          const hostname = (() => {
            try {
              return new URL(cleanUrl).hostname.split(".")[0];
            } catch {
              return cleanUrl;
            }
          })();
          const resolvedName = entry.name.trim() || data.appName || hostname;
          allTools.push({
            name: resolvedName,
            url: cleanUrl,
            description: `${resolvedName} — a standalone app`,
          });
          setScanStatuses((p) => ({ ...p, [entry.id]: "single" }));
          setScanCounts((p) => ({ ...p, [entry.id]: 1 }));
        }
      } catch {
        const hostname = (() => {
          try {
            return new URL(cleanUrl).hostname.split(".")[0];
          } catch {
            return cleanUrl;
          }
        })();
        const resolvedName = entry.name.trim() || hostname;
        allTools.push({
          name: resolvedName,
          url: cleanUrl,
          description: `${resolvedName} — a standalone app`,
        });
        setScanStatuses((p) => ({ ...p, [entry.id]: "error" }));
      }
    }

    const firstUrl = valid[0].url.trim().replace(/\/$/, "");
    setSourceUrl(firstUrl);
    setDiscoveredTools(allTools);
    setScanning(false);

    // Persist ALL entered app URLs so every field pre-fills on next visit
    const allEnteredUrls = valid.map((e) => e.url.trim().replace(/\/$/, "")).join(",");
    try {
      await authFetch("/api/seeds/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ miniAppsUrl: allEnteredUrls }),
      });
    } catch {
      /* non-critical — ignore */
    }
  };

  const removeConnected = (url: string) => {
    const remaining = discoveredTools.filter((t) => t.url !== url);
    setDiscoveredTools(remaining);
    if (!remaining.length) setSourceUrl("");
    else setSourceUrl(remaining[0].url);
  };

  // ── Connected state ──────────────────────────────────────────────────────
  if (isConnected) {
    // Group tools by source app hostname
    const uniqueHosts = [
      ...new Set(
        discoveredTools.map((t) => {
          try {
            return new URL(t.url).hostname;
          } catch {
            return t.url;
          }
        }),
      ),
    ];

    // Return to entry form keeping all existing app URLs pre-filled + one blank row to add more
    const goToAddMore = () => {
      const existingOrigins = [
        ...new Set(
          discoveredTools.map((t) => {
            try {
              return new URL(t.url).origin;
            } catch {
              return t.url;
            }
          }),
        ),
      ];
      const prefilled: AppEntry[] = existingOrigins.map((origin) => ({
        id: crypto.randomUUID(),
        name: "",
        url: origin,
      }));
      prefilled.push({ id: crypto.randomUUID(), name: "", url: "" }); // blank row to add another
      setDiscoveredTools([]);
      setSourceUrl("");
      setEntries(prefilled);
      setScanStatuses({});
      setScanCounts({});
    };

    return (
      <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: `${TEAL}70` }}>
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-card">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center text-white flex-shrink-0"
            style={{ background: TEAL }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground leading-none">
              {discoveredTools.length} tool{discoveredTools.length === 1 ? "" : "s"} from{" "}
              {uniqueHosts.length} site{uniqueHosts.length === 1 ? "" : "s"} connected
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              All funnelled through the Orbit steps below
            </p>
          </div>
        </div>

        {/* Per-app summary rows */}
        <div className="bg-card px-4 py-2 space-y-1.5">
          {uniqueHosts.map((host) => {
            const hostTools = discoveredTools.filter((t) => {
              try {
                return new URL(t.url).hostname === host;
              } catch {
                return t.url === host;
              }
            });
            const isSingle = hostTools.length === 1 && hostTools[0].url === `https://${host}`;
            return (
              <div
                key={host}
                className="rounded-xl border border-border bg-muted/20 px-3 py-2 flex items-center gap-2.5"
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[9px] font-black"
                  style={{ background: TEAL }}
                >
                  ✓
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{host}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {isSingle
                      ? "Connected as standalone app"
                      : `${hostTools.length} tool${hostTools.length === 1 ? "" : "s"} discovered`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const remaining = discoveredTools.filter((t) => {
                      try {
                        return new URL(t.url).hostname !== host;
                      } catch {
                        return t.url !== host;
                      }
                    });
                    setDiscoveredTools(remaining);
                    if (!remaining.length) setSourceUrl("");
                    else setSourceUrl(remaining[0].url);
                  }}
                  className="text-[11px] text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>

        {/* Add more apps */}
        <div className="px-4 pb-3 pt-1.5">
          <button
            onClick={goToAddMore}
            data-testid="btn-add-more-apps"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed font-bold text-xs transition-all hover:bg-muted/20"
            style={{ borderColor: `${TEAL}50`, color: TEAL }}
          >
            <span className="text-base leading-none">+</span> Add more apps
          </button>
        </div>
      </div>
    );
  }

  // ── Entry form ────────────────────────────────────────────────────────────
  const validCount = entries.filter((e) => e.url.trim()).length;

  return (
    <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: `${TEAL}30` }}>
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-card">
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center text-white flex-shrink-0"
          style={{ background: BURG }}
        >
          <Package className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">Connect Your Apps</p>
          <p className="text-[11px] text-muted-foreground">
            Paste deployed URLs — Orbit scans each one for tools automatically
          </p>
        </div>
        {urlsSaved && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 flex-shrink-0">
            <CheckCircle2 className="w-3 h-3" /> Saved
          </span>
        )}
      </div>

      <div className="bg-card p-4 space-y-3">
        {/* Quick-add presets — known Svivva ecosystem apps */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Quick Add (one-click)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { name: "Cyber Security Tools", url: "https://svivva.com/cyber-security-mini-apps" },
              { name: "AI Tools Hub", url: "https://svivva.com/ai-tools-hub" },
              { name: "SEO Pack", url: "https://svivva.com/seo-pack" },
              { name: "Cyber Security Tools", url: "https://svivva.com/cyber-security-mini-apps" },
              { name: "Marketing Hub", url: "https://svivva.com/marketing-hub" },
            ]
              .filter(
                (preset) => !entries.some((e) => e.url.trim().replace(/\/$/, "") === preset.url),
              )
              .map((preset) => (
                <button
                  key={preset.url}
                  disabled={scanning}
                  onClick={() => {
                    // Add to first empty slot or append new row
                    const emptyIdx = entries.findIndex((e) => !e.url.trim());
                    if (emptyIdx >= 0) {
                      const updated = entries.map((e, i) =>
                        i === emptyIdx ? { ...e, name: preset.name, url: preset.url } : e,
                      );
                      setEntries(updated);
                      persistEntries(updated);
                    } else {
                      const updated = [
                        ...entries,
                        { id: crypto.randomUUID(), name: preset.name, url: preset.url },
                      ];
                      setEntries(updated);
                      persistEntries(updated);
                    }
                  }}
                  className="text-[10px] px-2.5 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 font-semibold transition-colors disabled:opacity-40"
                >
                  + {preset.name}
                </button>
              ))}
            <button
              disabled={scanning}
              onClick={() => {
                const allPresets = [
                  {
                    name: "Cyber Security Tools",
                    url: "https://svivva.com/cyber-security-mini-apps",
                  },
                  { name: "AI Tools Hub", url: "https://svivva.com/ai-tools-hub" },
                  { name: "SEO Pack", url: "https://svivva.com/seo-pack" },
                  {
                    name: "Cyber Security Tools",
                    url: "https://svivva.com/cyber-security-mini-apps",
                  },
                  { name: "Marketing Hub", url: "https://svivva.com/marketing-hub" },
                ];
                const existing = entries.filter((e) => e.url.trim());
                const existingUrls = new Set(existing.map((e) => e.url.trim().replace(/\/$/, "")));
                const newOnes = allPresets.filter((p) => !existingUrls.has(p.url));
                if (!newOnes.length) return;
                const merged = [
                  ...existing.map((e) => ({ ...e })),
                  ...newOnes.map((p) => ({ id: crypto.randomUUID(), name: p.name, url: p.url })),
                ];
                if (!existing.length)
                  setEntries(
                    merged.length ? merged : [{ id: crypto.randomUUID(), name: "", url: "" }],
                  );
                else setEntries(merged);
                persistEntries(merged);
              }}
              className="text-[10px] px-2.5 py-1.5 rounded-lg border-2 border-dashed font-bold transition-colors disabled:opacity-40"
              style={{ borderColor: `${TEAL}60`, color: TEAL }}
            >
              ⚡ Add All Svivva Apps
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {entries.map((entry, idx) => {
            const st = scanStatuses[entry.id] ?? "idle";
            return (
              <div
                key={entry.id}
                className="rounded-xl border border-border bg-muted/20 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-semibold text-muted-foreground">App {idx + 1}</p>
                    {st === "scanning" && (
                      <Loader2 className="w-3 h-3 animate-spin text-[#5BA8A0]" />
                    )}
                    {st === "found" && (
                      <span className="text-[10px] font-bold text-green-600">
                        {scanCounts[entry.id]} tools found
                      </span>
                    )}
                    {st === "single" && (
                      <span className="text-[10px] font-bold text-[#5BA8A0]">
                        connected as 1 app
                      </span>
                    )}
                    {st === "error" && (
                      <span className="text-[10px] text-red-500">
                        connection failed — check URL
                      </span>
                    )}
                  </div>
                  {entries.length > 1 && (
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className="text-[11px] text-muted-foreground hover:text-red-500 transition-colors"
                      disabled={scanning}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={entry.name}
                  onChange={(e) => updateEntry(entry.id, "name", e.target.value)}
                  placeholder="Name (e.g. Pyracrypt, Cyber Tools)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#5BA8A0]/40 disabled:opacity-50"
                  disabled={scanning}
                  data-testid={`input-app-name-${idx}`}
                />
                <input
                  type="url"
                  value={entry.url}
                  onChange={(e) => updateEntry(entry.id, "url", e.target.value)}
                  placeholder="https://your-app.example.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#5BA8A0]/40 disabled:opacity-50"
                  disabled={scanning}
                  data-testid={`input-app-url-${idx}`}
                />
              </div>
            );
          })}
        </div>

        <button
          onClick={addEntry}
          disabled={scanning}
          className="w-full py-2 rounded-xl border border-dashed border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-[#5BA8A0]/60 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
          data-testid="button-add-app"
        >
          <span className="text-base leading-none">+</span> Add another App
        </button>

        <button
          onClick={scanAndConnect}
          disabled={validCount === 0 || scanning}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
          style={{
            background:
              validCount > 0 && !scanning ? `linear-gradient(135deg, ${BURG}, ${TEAL})` : undefined,
          }}
          data-testid="button-scan-connect-apps"
        >
          {scanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Scanning apps…
            </>
          ) : validCount === 0 ? (
            "Enter at least one URL"
          ) : (
            <>
              <Search className="w-4 h-4" /> Scan & Connect{" "}
              {validCount > 1 ? `all ${validCount} apps` : "app"}
            </>
          )}
        </button>
        <p className="text-[10px] text-muted-foreground text-center">
          Orbit auto-discovers tools from each URL via sitemap + page analysis
        </p>
      </div>
    </div>
  );
}

// ── Launch Station ────────────────────────────────────────────────────────
interface GscUrlItem {
  label: string;
  url: string;
  gscLink: string;
}

function LaunchStation({
  launchActive,
  launchDone,
  launchProgress,
  launchCopied,
  setLaunchCopied,
  setLaunchDone,
  onLaunch,
  coreUrls,
  toolUrls,
  totalSteps,
  sitemapUrl,
}: {
  launchActive: boolean;
  launchDone: boolean;
  launchProgress: string;
  launchCopied: string | null;
  setLaunchCopied: (v: string | null) => void;
  setLaunchDone: (v: boolean) => void;
  onLaunch: () => void;
  coreUrls: GscUrlItem[];
  toolUrls: GscUrlItem[];
  totalSteps: number;
  sitemapUrl: string;
}) {
  const allUrls = [...coreUrls, ...toolUrls].map((u) => u.url).join("\n");
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSitemap, setCopiedSitemap] = useState(false);

  const copyAll = () => {
    navigator.clipboard.writeText(allUrls);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };
  const copySitemap = () => {
    navigator.clipboard.writeText(sitemapUrl);
    setCopiedSitemap(true);
    setTimeout(() => setCopiedSitemap(false), 2000);
  };

  const borderColor = launchDone ? "#16a34a" : "#eab308";
  const headerBg = launchDone ? "rgba(22,163,74,0.1)" : "rgba(234,179,8,0.12)";
  const iconBg = launchDone ? "#16a34a" : launchActive ? TEAL : "#eab308";

  return (
    <div
      id="orbit-full-marketing-strategy"
      className="rounded-2xl overflow-hidden border-2 scroll-mt-6"
      style={{
        borderColor,
        background: launchDone ? "rgba(22,163,74,0.04)" : "rgba(234,179,8,0.05)",
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: headerBg }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
          style={{ background: iconBg }}
        >
          {launchActive ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : launchDone ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Rocket className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm text-foreground">
            {launchDone
              ? "Done — 2 manual steps left for Google"
              : launchActive
                ? launchProgress || "Running…"
                : "Launch Everything in Orbit"}
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            {launchDone
              ? `${coreUrls.length + toolUrls.length} URLs ready to index — copy & paste below`
              : launchActive
                ? "Running all steps automatically — do not close this tab"
                : `Runs all ${totalSteps} steps across both tabs · Bing/Yandex/Yahoo auto-submitted · Google requires 2 manual steps below`}
          </p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Big yellow button */}
        {!launchDone && (
          <button
            onClick={onLaunch}
            disabled={launchActive}
            data-testid="btn-launch-everything"
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-black text-base text-white transition-all active:scale-95 disabled:opacity-70"
            style={{
              background: launchActive
                ? TEAL
                : "linear-gradient(135deg, #b45309, #eab308, #fde047, #eab308)",
            }}
          >
            {launchActive ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Running — do not close this tab…
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5" /> Launch Everything in Orbit
              </>
            )}
          </button>
        )}

        {/* After completion: Copy-Paste Station */}
        {launchDone && (
          <div className="space-y-4">
            {/* Already done automatically */}
            <div className="rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-green-700 dark:text-green-400 mb-1">
                ✅ Done automatically
              </p>
              <p className="text-xs text-green-800 dark:text-green-300">
                All pages built · Bing, Yandex, Yahoo, DuckDuckGo submitted via IndexNow · Sitemap
                live at <span className="font-mono">/sitemap.xml</span>
              </p>
            </div>

            {/* Step 1 — Submit sitemap to Google */}
            <div className="rounded-xl border border-amber-300 dark:border-amber-700 overflow-hidden">
              <div className="bg-amber-50 dark:bg-amber-950/30 px-3 py-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                  1
                </span>
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Submit your sitemap to Google{" "}
                  <span className="font-normal opacity-70">(one-time setup)</span>
                </p>
              </div>
              <div className="px-3 py-2.5 space-y-2 bg-white dark:bg-card">
                <p className="text-[11px] text-muted-foreground">
                  GSC → Sitemaps (left sidebar) → paste this URL → click Submit
                </p>
                <div className="flex items-center gap-2 rounded-lg bg-muted/40 border border-border px-3 py-2">
                  <code className="text-xs text-foreground flex-1 break-all">{sitemapUrl}</code>
                  <button
                    onClick={copySitemap}
                    className="flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg text-white transition-colors"
                    style={{ background: copiedSitemap ? "#16a34a" : TEAL }}
                  >
                    <Copy className="w-3 h-3" />
                    {copiedSitemap ? "Copied!" : "Copy"}
                  </button>
                </div>
                <a
                  href="https://search.google.com/search-console/sitemaps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-bold text-sm text-white transition-all hover:opacity-90"
                  style={{ background: "#1a73e8" }}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open GSC → Sitemaps
                </a>
              </div>
            </div>

            {/* Step 2 — Request Indexing */}
            <div className="rounded-xl border border-amber-300 dark:border-amber-700 overflow-hidden">
              <div className="bg-amber-50 dark:bg-amber-950/30 px-3 py-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                  2
                </span>
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Request indexing for your pages{" "}
                  <span className="font-normal opacity-70">
                    ({coreUrls.length + toolUrls.length} URLs)
                  </span>
                </p>
              </div>
              <div className="px-3 py-2.5 space-y-2 bg-white dark:bg-card">
                <p className="text-[11px] text-muted-foreground">
                  GSC → paste a URL in the top search bar → press Enter → click{" "}
                  <strong>"Request Indexing"</strong>. Copy all URLs below then paste one at a time.
                </p>
                <textarea
                  readOnly
                  value={allUrls}
                  rows={Math.min(coreUrls.length + toolUrls.length, 10)}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs font-mono text-foreground resize-none focus:outline-none focus:ring-1 cursor-pointer"
                  style={{ lineHeight: "1.6" }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={copyAll}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm text-white transition-all"
                    style={{ background: copiedAll ? "#16a34a" : TEAL }}
                  >
                    <Copy className="w-4 h-4" />
                    {copiedAll
                      ? "Copied all URLs!"
                      : `Copy All ${coreUrls.length + toolUrls.length} URLs`}
                  </button>
                  <a
                    href="https://search.google.com/search-console/inspect"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 rounded-lg font-bold text-sm text-white transition-all hover:opacity-90"
                    style={{ background: "#1a73e8" }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open GSC
                  </a>
                </div>
              </div>
            </div>

            <button
              onClick={() => setLaunchDone(false)}
              className="w-full py-2 rounded-xl text-xs text-muted-foreground border border-border hover:bg-muted/30 transition-colors"
            >
              Run again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Google Indexing Panel — always visible once URLs exist ─────────────────
function GoogleIndexPanel({
  coreUrls,
  toolUrls,
  sitemapUrl,
}: {
  coreUrls: GscUrlItem[];
  toolUrls: GscUrlItem[];
  sitemapUrl: string;
}) {
  const total = coreUrls.length + toolUrls.length;
  const allUrls = [...coreUrls, ...toolUrls].map((u) => u.url).join("\n");

  const [copiedSitemap, setCopiedSitemap] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [open, setOpen] = useState(true);

  const copySitemap = () => {
    navigator.clipboard.writeText(sitemapUrl);
    setCopiedSitemap(true);
    setTimeout(() => setCopiedSitemap(false), 2000);
  };
  const copyAll = () => {
    navigator.clipboard.writeText(allUrls);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  if (!total) return null;

  return (
    <div
      className="rounded-2xl border-2 overflow-hidden"
      style={{ borderColor: "#1a73e830", background: "#1a73e806" }}
    >
      {/* Header — always visible, click to collapse */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        style={{ background: "#1a73e810" }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
          style={{ background: "#1a73e8" }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">Google Indexing — Copy &amp; Paste</p>
          <p className="text-[11px] text-muted-foreground">
            {total} URLs ready · sitemap + request indexing
          </p>
        </div>
        <span className="text-[10px] text-muted-foreground flex-shrink-0 pr-1">
          {open ? "▲ hide" : "▼ show"}
        </span>
      </button>

      {open && (
        <div className="px-4 py-4 space-y-3 bg-white dark:bg-card">
          {/* Step 1 — Sitemap */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#1a73e8] text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">
                1
              </span>
              Submit sitemap to Google{" "}
              <span className="font-normal text-muted-foreground">(one-time)</span>
            </p>
            <p className="text-[10px] text-muted-foreground pl-5">
              GSC → Sitemaps (left sidebar) → paste → Submit
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 border border-border px-3 py-2 ml-5">
              <code className="text-xs text-foreground flex-1 break-all select-all">
                {sitemapUrl}
              </code>
              <button
                onClick={copySitemap}
                className="flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg text-white transition-colors"
                style={{ background: copiedSitemap ? "#16a34a" : "#1a73e8" }}
              >
                <Copy className="w-3 h-3" />
                {copiedSitemap ? "Copied!" : "Copy"}
              </button>
            </div>
            <a
              href="https://search.google.com/search-console/sitemaps"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-5 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm text-white hover:opacity-90 transition-opacity"
              style={{ background: "#1a73e8" }}
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open GSC → Sitemaps
            </a>
          </div>

          <div className="border-t border-border" />

          {/* Step 2 — Request indexing */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#1a73e8] text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">
                2
              </span>
              Request indexing for all {total} pages
            </p>
            <p className="text-[10px] text-muted-foreground pl-5">
              GSC → paste a URL in the top bar → Enter → <strong>Request Indexing</strong>. Do this
              for each URL below.
            </p>
            <textarea
              readOnly
              value={allUrls}
              rows={Math.min(total, 8)}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs font-mono text-foreground resize-none focus:outline-none cursor-pointer ml-0"
              style={{ lineHeight: "1.7" }}
              data-testid="textarea-google-urls"
            />
            <div className="flex gap-2">
              <button
                onClick={copyAll}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm text-white transition-colors"
                style={{ background: copiedAll ? "#16a34a" : "#1a73e8" }}
                data-testid="btn-copy-all-google-urls"
              >
                <Copy className="w-4 h-4" />
                {copiedAll ? "Copied!" : `Copy All ${total} URLs`}
              </button>
              <a
                href="https://search.google.com/search-console/inspect"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 rounded-lg font-bold text-sm text-white hover:opacity-90 transition-opacity"
                style={{ background: "#1a73e8" }}
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open GSC
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step card ─────────────────────────────────────────────────────────────
function StepCard({
  step,
  idx,
  status,
  result,
  onExecute,
  onReset,
  isQueued,
  toolCount,
}: {
  step: Step;
  idx: number;
  status: StepStatus;
  result: string;
  onExecute: () => void;
  onReset: () => void;
  isQueued: boolean;
  toolCount?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = step.icon;

  const borderCls = {
    pending: "border-border",
    running: "border-[#5BA8A0]/50",
    done: "border-green-400/60",
    error: "border-red-400/60",
  }[status];
  const bgCls = {
    pending: "bg-card",
    running: "bg-[#5BA8A0]/5",
    done: "bg-green-50 dark:bg-green-950/20",
    error: "bg-red-50 dark:bg-red-950/20",
  }[status];

  const canExecute = !step.needsTools || (toolCount !== undefined && toolCount > 0);

  const btnLabel =
    status === "done"
      ? "Done ✓"
      : status === "running"
        ? "Running…"
        : status === "error"
          ? "Retry"
          : isQueued
            ? "Queued"
            : step.needsTools && toolCount === undefined
              ? "Discover tools first ↑"
              : step.needsTools && toolCount === 0
                ? "No tools found ↑"
                : step.needsTools && toolCount
                  ? `Generate ${toolCount * 4} Pages`
                  : "Run Step";

  return (
    <div
      className={`rounded-2xl border-2 ${borderCls} ${bgCls} overflow-hidden transition-all duration-200`}
      data-testid={`step-${step.id}`}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-black text-sm
            ${status === "done" ? "bg-green-500" : status === "running" ? "bg-[#5BA8A0]" : status === "error" ? "bg-red-500" : isQueued ? "bg-amber-400" : "bg-muted-foreground/25"}`}
          >
            {status === "done" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : status === "running" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>{idx + 1}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: TEAL }} />
              <p className="text-sm font-bold text-foreground">{step.title}</p>
              {step.estimate && status === "pending" && (
                <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                  {step.estimate}
                </span>
              )}
              {isQueued && status === "pending" && (
                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
                  Queued
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {step.description}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <button
            onClick={onExecute}
            disabled={status === "running" || status === "done" || isQueued || !canExecute}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-40 active:scale-95 min-h-[44px]"
            style={{
              background:
                status === "done"
                  ? "#16a34a"
                  : status === "error"
                    ? "#dc2626"
                    : status === "running"
                      ? "#94a3b8"
                      : canExecute
                        ? TEAL
                        : "#94a3b8",
            }}
            data-testid={`btn-${step.id}`}
          >
            {status === "running" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {status === "pending" && !isQueued && canExecute && <Play className="w-3.5 h-3.5" />}
            {btnLabel}
          </button>

          {status === "done" && result && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs text-muted-foreground border border-border hover:bg-muted/40 transition-colors min-h-[44px]"
            >
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              {expanded ? "Hide" : "Results"}
            </button>
          )}

          {(status === "done" || status === "error") && (
            <button
              onClick={onReset}
              title="Reset step"
              className="w-11 h-11 rounded-xl flex items-center justify-center text-muted-foreground border border-border hover:bg-muted/40 transition-colors flex-shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Running progress */}
      {status === "running" && result && (
        <div className="border-t border-[#5BA8A0]/30 bg-[#5BA8A0]/5 px-4 py-2">
          <p className="text-xs text-[#5BA8A0] font-medium">{result}</p>
        </div>
      )}

      {/* Completed — show auto done + manual todo */}
      {status === "done" && (
        <div className="border-t border-green-200 dark:border-green-900">
          {/* What ran automatically */}
          {step.auto && step.auto.length > 0 && (
            <div className="px-4 pt-3 pb-2 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-green-700 dark:text-green-400">
                ✅ Ran automatically
              </p>
              {step.auto.map((item, i) => (
                <p key={i} className="text-xs text-green-800 dark:text-green-300 leading-snug pl-1">
                  • {item}
                </p>
              ))}
            </div>
          )}
          {/* What you need to do */}
          {step.manual && step.manual.length > 0 && (
            <div className="mx-4 mb-3 mt-1 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                ⚠ You need to do this
              </p>
              <p className="text-[9px] text-pink-700 dark:text-pink-400 font-medium pb-0.5">
                Also listed in the pink <strong>Your turn</strong> checklist (scroll up) — tick
                items there when done.
              </p>
              {step.manual.map((item, i) => (
                <p key={i} className="text-xs text-amber-900 dark:text-amber-200 leading-snug pl-1">
                  • {item}
                </p>
              ))}
            </div>
          )}
          {/* Technical results (collapsible) */}
          {result && (
            <div className="border-t border-border bg-muted/20 px-4 py-2">
              {expanded ? (
                <pre className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                  {result}
                </pre>
              ) : (
                <p className="text-xs text-muted-foreground truncate">{result.split("\n")[0]}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Before running — show a preview of what's manual */}
      {status === "pending" && step.manual && step.manual.length > 0 && (
        <div className="border-t border-border px-4 py-2">
          <p className="text-[10px] text-muted-foreground">
            <span className="font-semibold text-amber-600">After this step you'll need to:</span>{" "}
            {step.manual[0]}
            {step.manual.length > 1 ? ` + ${step.manual.length - 1} more` : ""}
          </p>
        </div>
      )}

      {status === "error" && result && (
        <div className="border-t border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/10 px-4 py-2">
          <p className="text-xs text-red-600 dark:text-red-400">{result}</p>
        </div>
      )}
    </div>
  );
}

// ── Deploy Guide ──────────────────────────────────────────────────────────
const SUBDOMAINS = [
  { sub: "apps", target: "apps.svivva.com", label: "Clutety mini-apps hub", color: "#6B2C4A" },
  { sub: "security", target: "svivva.com", label: "Cyber security tools hub", color: "#5BA8A0" },
  {
    sub: "clutety",
    target: "svivva.com",
    label: "Legacy alias → /cyber-security-mini-apps",
    color: "#5BA8A0",
  },
  {
    sub: "pyracrypt",
    target: "svivva.com",
    label: "Pyracrypt legacy alias",
    color: "#5BA8A0",
  },
];

function CopyInline({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border border-border bg-muted/40 hover:bg-muted transition-colors font-mono ml-1"
    >
      {copied ? (
        <CheckCircle2 className="w-3 h-3 text-green-500" />
      ) : (
        <Eye className="w-3 h-3 opacity-50" />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function DeployGuide({ publicHost, publicSite }: { publicHost: string; publicSite: string }) {
  const [openSection, setOpenSection] = useState<string | null>("deploy");
  const toggle = (id: string) => setOpenSection((p) => (p === id ? null : id));

  const Section = ({
    id,
    num,
    title,
    color,
    children,
  }: {
    id: string;
    num: string;
    title: string;
    color: string;
    children: React.ReactNode;
  }) => (
    <div className="rounded-2xl border-2 border-border overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/30 text-left transition-colors"
        onClick={() => toggle(id)}
      >
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0"
          style={{ background: color }}
        >
          {num}
        </div>
        <span className="text-sm font-bold text-foreground flex-1">{title}</span>
        {openSection === id ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {openSection === id && (
        <div className="px-4 pb-4 pt-2 space-y-3 border-t border-border bg-muted/10">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="px-1">
        <p className="text-sm font-bold text-foreground">
          Deploy Svivva + connect all 3 apps to {publicHost}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Follow in order — takes about 15 minutes total.
        </p>
      </div>

      {/* Step 1: Deploy Svivva */}
      <Section id="deploy" num="1" title="Deploy Svivva (crash-free)" color={BURG}>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p className="text-foreground font-semibold">Why Svivva crashes and how to prevent it:</p>
          <ul className="space-y-1.5 list-none">
            {[
              "Out-of-memory: The free hosting tier has 512MB RAM. If you have large AI calls, use streaming responses.",
              `Missing env vars: In Secrets, make sure DATABASE_URL, OPENAI_API_KEY, NEXTAUTH_SECRET, and NEXT_PUBLIC_SITE_URL=${publicSite} are all set.`,
              "Cold start timeout: Use the Always On feature (Deployments → Autoscale) to keep it warm.",
              "Build errors: Run 'npm run build' in the shell first — fix any TypeScript errors before deploying.",
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-[#6B2C4A]/20 text-[#6B2C4A] text-[10px] font-black flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-xl border border-border bg-card px-3 py-2 space-y-1.5">
            <p className="font-semibold text-foreground">Deploy steps:</p>
            {[
              "Push this repo to GitHub and import it in Vercel (or your host)",
              "Add env vars in the host dashboard: DATABASE_URL, OPENAI_API_KEY, NEXTAUTH_SECRET, NEXT_PUBLIC_SITE_URL",
              "Deploy — wait for the production build to finish",
              "In the host → Domains, add svivva.com and www as instructed (DNS at GoDaddy)",
              "TLS is provisioned automatically by the host",
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[#5BA8A0] font-bold flex-shrink-0">{i + 1}.</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Step 2: Point svivva.com root */}
      <Section id="root" num="2" title="Point svivva.com → Svivva (GoDaddy DNS)" color={TEAL}>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>
            In GoDaddy DNS Manager for <strong className="text-foreground">svivva.com</strong>, add:
          </p>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-4 gap-0 text-[11px] font-bold text-foreground border-b border-border px-3 py-2 bg-muted/30">
              <span>Type</span>
              <span>Name</span>
              <span>Value</span>
              <span>TTL</span>
            </div>
            {[
              { type: "CNAME", name: "www", value: "your-svivva-deploy-host.com", ttl: "1 hr" },
              {
                type: "A / ALIAS",
                name: "@",
                value: "Use your host's IP (shown in deploy settings)",
                ttl: "600s",
              },
            ].map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-4 gap-0 text-[11px] px-3 py-2 border-b last:border-0 border-border"
              >
                <span className="font-mono font-bold text-[#5BA8A0]">{row.type}</span>
                <span className="font-mono">{row.name}</span>
                <span className="font-mono truncate text-muted-foreground">{row.value}</span>
                <span>{row.ttl}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px]">
            Your hosting platform will verify ownership and enable TLS within a few minutes of
            deployment.
          </p>
        </div>
      </Section>

      {/* Step 3: 3 subdomains */}
      <Section id="subdomains" num="3" title="Connect 3 apps as subdomains" color="#4ade80">
        <div className="space-y-3 text-xs">
          <p className="text-muted-foreground">
            Add these 3 CNAME records in GoDaddy DNS for{" "}
            <strong className="text-foreground">svivva.com</strong>. You can also run the "Set Up
            All 3 Subdomains" step above to auto-create them. The CNAME targets are the hosted app
            domains from your deployment dashboard.
          </p>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_1fr] gap-0 text-[11px] font-bold text-foreground border-b border-border px-3 py-2 bg-muted/30">
              <span className="pr-4">Subdomain</span>
              <span>Resolves to</span>
              <span className="pl-2">App</span>
            </div>
            {SUBDOMAINS.map((s) => (
              <div
                key={s.sub}
                className="grid grid-cols-[auto_1fr_1fr] gap-0 text-[11px] px-3 py-2.5 border-b last:border-0 border-border items-center"
              >
                <div className="pr-4">
                  <span className="font-mono font-bold text-foreground">{s.sub}</span>
                  <span className="text-muted-foreground">.svivva.com</span>
                  <CopyInline text={`${s.sub}.svivva.com`} />
                </div>
                <span className="font-mono text-muted-foreground truncate text-[10px]">
                  {s.target}
                  <CopyInline text={s.target} />
                </span>
                <span className="pl-2 text-[10px]" style={{ color: s.color }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-[#5BA8A0]/30 bg-[#5BA8A0]/5 px-3 py-2 text-[11px] text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">After adding CNAMEs:</p>
            <p>1. Wait 5–30 min for DNS to propagate</p>
            <p>2. In each app's deploy settings: Custom Domain → add the subdomain</p>
            <p>3. TLS is auto-provisioned — no extra SSL steps needed</p>
          </div>
        </div>
      </Section>

      {/* Step 4: Verify & SEO */}
      <Section id="seo" num="4" title="Verify + maximise traffic" color="#E91E8C">
        <div className="space-y-2 text-xs text-muted-foreground">
          {[
            {
              label: "Google Search Console",
              desc: "Add svivva.com as a property → verify via TXT record → submit sitemap.xml. Repeat for each subdomain to track their traffic separately.",
              href: "https://search.google.com/search-console",
              cta: "Open →",
            },
            {
              label: "IndexNow (Bing/Yandex)",
              desc: "Run the IndexNow step in Orbit → instantly pushes all svivva.com pages to Bing, Yandex, Yahoo. Re-run whenever you publish new pages.",
              href: null,
              cta: null,
            },
            {
              label: "Always On",
              desc: "Serverless hosts scale from zero; first request after idle can be slower. For heavy cron-style work, use your host's background jobs or an external scheduler hitting your API with ORBIT_INTERNAL_SECRET.",
              href: "https://vercel.com/docs/cron-jobs",
              cta: "Vercel Cron →",
            },
            {
              label: "Analytics",
              desc: "Add Clarity (free) or Plausible to each app for visitor heatmaps. Svivva already has Clarity support — add NEXT_PUBLIC_CLARITY_ID in Secrets.",
              href: "https://clarity.microsoft.com",
              cta: "Get free Clarity →",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border bg-card px-3 py-2.5 space-y-0.5"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground text-xs">{item.label}</p>
                {item.href && (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#5BA8A0] hover:underline flex items-center gap-0.5"
                  >
                    {item.cta}
                    <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                  </a>
                )}
              </div>
              <p className="text-[11px]">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

const PINK_COACH = "#ec4899";
const PINK_COACH_BORDER = "rgba(236,72,153,0.55)";

/** What Orbit can infer from the database (IndexNow, step thresholds) vs. what only you can do (GSC login, paste posts). */
function computeManualSmart(
  stepId: string,
  text: string,
  orbit:
    | {
        stepCompletion?: Record<string, boolean>;
        indexNowSubmitted?: boolean;
        hubExists?: boolean;
      }
    | null
    | undefined,
): {
  dbStepOk: boolean;
  likelyAutoDone: boolean;
  likelyReason?: string;
  needsOutsideApp: boolean;
  outsideHint?: string;
} {
  const lower = text.toLowerCase();
  const mentionsBingSide = /bing|yandex|yahoo|duckduckgo|indexnow/.test(lower);
  const mentionsGscAction = /google search console|\bgsc\b|url inspection|request indexing/i.test(
    text,
  );
  const mentionsPasteOrAccount =
    /copy each|copy the|paste into|paste it|publish it|logged-?in|sign-?up|your inbox|from your own|directory website|go to godaddy|add cname/i.test(
      lower,
    );

  let likelyAutoDone = false;
  let likelyReason: string | undefined;
  if (orbit?.indexNowSubmitted && mentionsBingSide && !mentionsGscAction) {
    likelyAutoDone = true;
    likelyReason =
      "IndexNow on the server already pushed these URLs to Bing, Yandex, Yahoo, and DuckDuckGo — nothing else is required here for those engines.";
  }

  const dbStepOk = !!(orbit?.stepCompletion && orbit.stepCompletion[stepId]);

  let needsOutsideApp = mentionsGscAction || mentionsPasteOrAccount;
  let outsideHint: string | undefined;
  if (mentionsGscAction && !likelyAutoDone) {
    outsideHint =
      "Use “Start traffic now” with a GSC service account, or check this off after Search Console.";
  } else if (mentionsPasteOrAccount && !likelyAutoDone) {
    outsideHint =
      "Needs your login on that site — Orbit generated the text but cannot post as you.";
  }

  if (stepId === "mini-hub" && orbit?.hubExists && mentionsGscAction) {
    outsideHint =
      "The /tools hub page is live on svivva.com; GSC indexing is still something only you can confirm in Google.";
  }

  return { dbStepOk, likelyAutoDone, likelyReason, needsOutsideApp, outsideHint };
}

function renderManualLineWithUrls(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/gi);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//i.test(part) ? (
          <a
            key={i}
            href={part.replace(/\)+$/, "")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-700 dark:text-pink-300 font-medium underline underline-offset-2 break-all"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/** Full traffic automation + optional indexing-only pass. */
function OrbitTrafficAutomation({
  manualTasks,
  onDone,
  onSyncSteps,
  onAutoCheckKeys,
}: {
  manualTasks: Array<{
    key: string;
    stepId: string;
    text: string;
    smart: { likelyAutoDone: boolean; needsOutsideApp: boolean };
  }>;
  onDone?: () => void;
  onSyncSteps?: (stepCompletion: Record<string, boolean>) => void;
  onAutoCheckKeys?: (keys: string[]) => void;
}) {
  const { toast } = useToast();
  const [fullLoading, setFullLoading] = useState(false);
  const [indexLoading, setIndexLoading] = useState(false);
  const [lastLog, setLastLog] = useState<string | null>(null);

  const runFullTraffic = async () => {
    setFullLoading(true);
    setLastLog(null);
    try {
      const res = await authFetch("/api/orbit/full-traffic-automation", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setLastLog(typeof data.summary === "string" ? data.summary : "");
      if (data.stepCompletion) onSyncSteps?.(data.stepCompletion);
      if (data.automationContext) {
        onAutoCheckKeys?.(getAutoCompletableManualKeys(manualTasks, data.automationContext));
      }
      onDone?.();
      toast({
        title: "Traffic automation complete",
        description: "On-site content published + search engines notified. Checklist auto-updated.",
        duration: 12000,
      });
    } catch (e) {
      setLastLog(String(e));
      toast({ title: "Automation failed", description: String(e), variant: "destructive" });
    } finally {
      setFullLoading(false);
    }
  };

  const runIndexingOnly = async () => {
    setIndexLoading(true);
    setLastLog(null);
    try {
      const res = await authFetch("/api/orbit/automate-manual", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setLastLog(typeof data.summary === "string" ? data.summary : "");
      onAutoCheckKeys?.(
        getAutoCompletableManualKeys(manualTasks, {
          indexNowOk: !!data.indexNow?.ok,
          googleSitemapOk: !!data.googleSitemap?.ok,
          googleIndexingSubmitted: data.googleIndexing?.submitted ?? 0,
        }),
      );
      onDone?.();
      toast({ title: "Indexing pass done", duration: 8000 });
    } catch (e) {
      setLastLog(String(e));
      toast({ title: "Indexing failed", description: String(e), variant: "destructive" });
    } finally {
      setIndexLoading(false);
    }
  };

  const busy = fullLoading || indexLoading;

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy}
        onClick={runFullTraffic}
        className="w-full inline-flex items-center justify-center gap-2 px-3 py-3.5 rounded-xl text-sm font-black text-white disabled:opacity-60 border-2 border-pink-400/40 shadow-md"
        style={{ background: `linear-gradient(135deg, ${PINK_COACH}, #a21caf, ${PINK_COACH})` }}
      >
        {fullLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Rocket className="w-4 h-4" />
        )}
        Start traffic now — automate everything possible
      </button>
      <p className="text-[10px] text-pink-950/90 dark:text-pink-50/90 leading-snug font-medium">
        Publishes <strong>blog posts, SEO pages, comparisons, 300 tool pages</strong> on{" "}
        <strong>svivva.com</strong>, then IndexNow + Bing + Google API. Auto-checks this list.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={runIndexingOnly}
        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-60"
        style={{ background: `linear-gradient(135deg, ${TEAL}, #0d9488)` }}
      >
        {indexLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Zap className="w-3.5 h-3.5" />
        )}
        Indexing only (skip creating new pages)
      </button>
      <p className="text-[10px] text-pink-900/85 dark:text-pink-100/80 leading-snug">
        Cannot auto-post to Reddit, Medium, Product Hunt, or directories (your login required).{" "}
        <Link href="/dashboard/gsc-connect" className="font-bold underline">
          GSC service account
        </Link>{" "}
        unlocks Google sitemap + up to 1000 URL indexing requests.
      </p>
      {lastLog && (
        <pre className="text-[10px] leading-relaxed whitespace-pre-wrap font-mono max-h-48 overflow-y-auto rounded-lg border border-pink-200/60 dark:border-pink-800/50 bg-white/70 dark:bg-black/20 px-2 py-1.5 text-pink-950 dark:text-pink-50">
          {lastLog}
        </pre>
      )}
    </div>
  );
}

function PinkManualCoach({
  manualTasks,
  checkedManual,
  onToggleCheck,
  onResetChecks,
  orbitFreeAi,
  totalDone,
  totalSteps,
  onRefetchOrbit,
  onSyncSteps,
  onAutoCheckKeys,
}: {
  manualTasks: Array<{
    key: string;
    stepId: string;
    stepTitle: string;
    text: string;
    smart: ReturnType<typeof computeManualSmart>;
  }>;
  checkedManual: Record<string, boolean>;
  onToggleCheck: (key: string) => void;
  onResetChecks: () => void;
  orbitFreeAi: boolean;
  totalDone: number;
  totalSteps: number;
  onRefetchOrbit?: () => void;
  onSyncSteps?: (stepCompletion: Record<string, boolean>) => void;
  onAutoCheckKeys?: (keys: string[]) => void;
}) {
  const [open, setOpen] = useState(true);
  const [aiGuide, setAiGuide] = useState<string | null>(null);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const doneN = manualTasks.filter((t) => checkedManual[t.key]).length;
  const allN = manualTasks.length;
  const orbitHandledN = manualTasks.filter((t) => t.smart.likelyAutoDone).length;
  const needYouN = manualTasks.filter(
    (t) => !t.smart.likelyAutoDone && t.smart.needsOutsideApp,
  ).length;

  const runSimplify = async () => {
    if (!manualTasks.length) return;
    setAiLoading(true);
    setAiHint(null);
    try {
      const res = await authFetch("/api/orbit/simplify-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: manualTasks.map((t) => t.text) }),
      });
      const data = await res.json();
      if (data.guide) setAiGuide(data.guide);
      if (data.hint) setAiHint(data.hint);
      if (data.error && !data.guide) setAiGuide(`Could not reach AI. ${data.error}`);
    } catch (e) {
      setAiGuide(`Network error: ${String(e)}`);
    } finally {
      setAiLoading(false);
    }
  };

  if (totalDone === 0) {
    return (
      <div
        className="rounded-2xl border-2 px-4 py-3 space-y-1"
        style={{
          borderColor: PINK_COACH_BORDER,
          background: "linear-gradient(135deg, rgba(236,72,153,0.12), rgba(244,114,182,0.06))",
        }}
      >
        <p className="text-sm font-black text-pink-950 dark:text-pink-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: PINK_COACH }} />
          Your turn (easy mode)
        </p>
        <p className="text-xs text-pink-900/80 dark:text-pink-100/75 leading-relaxed">
          Run <strong>Run Everything</strong> or individual steps first. When steps turn green,
          every <strong>You need to do this</strong> line is copied here. The list updates from your
          live Orbit database (IndexNow, page counts) so lines that only referred to Bing/Yandex can
          show as <strong>already handled</strong>. Optional <strong>Condense with AI</strong> just
          rewrites the text shorter — it does not log into Google or post for you.
        </p>
        <div className="pt-2 border-t border-pink-200/50 dark:border-pink-800/40 mt-2">
          <OrbitTrafficAutomation
            manualTasks={manualTasks}
            onDone={onRefetchOrbit}
            onSyncSteps={onSyncSteps}
            onAutoCheckKeys={onAutoCheckKeys}
          />
        </div>
      </div>
    );
  }

  if (manualTasks.length === 0) {
    return (
      <div
        className="rounded-2xl border-2 px-4 py-3 space-y-1"
        style={{
          borderColor: PINK_COACH_BORDER,
          background: "linear-gradient(135deg, rgba(236,72,153,0.12), rgba(244,114,182,0.06))",
        }}
      >
        <p className="text-sm font-black text-pink-950 dark:text-pink-100 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Your turn — nothing queued
        </p>
        <p className="text-xs text-pink-900/80 dark:text-pink-100/75">
          {totalDone}/{totalSteps} steps are done. There are no separate manual follow-ups on those
          steps yet, or run more steps to add tasks here.
        </p>
        <div className="pt-2 border-t border-pink-200/50 dark:border-pink-800/40 mt-2">
          <OrbitTrafficAutomation
            manualTasks={manualTasks}
            onDone={onRefetchOrbit}
            onSyncSteps={onSyncSteps}
            onAutoCheckKeys={onAutoCheckKeys}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border-2 overflow-hidden shadow-lg shadow-pink-500/15 dark:shadow-pink-900/25 bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 dark:from-pink-950/45 dark:via-rose-950/25 dark:to-fuchsia-950/20"
      style={{ borderColor: PINK_COACH_BORDER }}
    >
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
          style={{ background: `linear-gradient(135deg, ${PINK_COACH}, #db2777)` }}
        >
          <ListChecks className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-pink-950 dark:text-pink-50">
            Your turn — smart checklist
          </p>
          <p className="text-[11px] text-pink-800/85 dark:text-pink-200/80 leading-snug">
            <strong>{doneN}</strong> you ticked · <strong>{orbitHandledN}</strong> Orbit marks done
            (Bing/IndexNow side) · <strong>~{needYouN}</strong> usually need Google/social login ·{" "}
            <strong>{allN}</strong> lines total
          </p>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-pink-800 dark:text-pink-200 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-pink-800 dark:text-pink-200 flex-shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-pink-200/60 dark:border-pink-800/40">
          <div className="pt-3">
            <OrbitTrafficAutomation
              manualTasks={manualTasks}
              onDone={onRefetchOrbit}
              onSyncSteps={onSyncSteps}
              onAutoCheckKeys={onAutoCheckKeys}
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              disabled={aiLoading}
              onClick={runSimplify}
              title="Rewrites this checklist into one short playbook (does not perform any action for you)."
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${PINK_COACH}, #a21caf)` }}
            >
              {aiLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              Condense with AI {orbitFreeAi ? "" : "(set GEMINI_API_KEY or OLLAMA_URL)"}
            </button>
            <button
              type="button"
              onClick={() => {
                const lines = manualTasks.map((t, i) => `${i + 1}. [${t.stepTitle}] ${t.text}`);
                navigator.clipboard.writeText(lines.join("\n"));
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-pink-300 dark:border-pink-700 bg-white/70 dark:bg-pink-950/40 text-pink-950 dark:text-pink-50"
            >
              <Copy className="w-3.5 h-3.5" /> Copy all
            </button>
            <button
              type="button"
              onClick={onResetChecks}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-pink-300/60 text-pink-900 dark:text-pink-100"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset ticks
            </button>
          </div>

          <p className="flex gap-1.5 text-[10px] text-pink-900/90 dark:text-pink-100/85 leading-snug bg-pink-100/40 dark:bg-pink-900/25 rounded-lg px-2.5 py-2 border border-pink-200/50 dark:border-pink-800/40">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-pink-600 dark:text-pink-400" />
            <span>
              <strong>Condense with AI</strong> only <em>summarizes</em> this list (Gemini/Ollama)
              into a shorter playbook — it does not open Search Console or post anywhere.{" "}
              <strong>Run all automatable server actions</strong> (above) performs real indexing
              calls.
            </span>
          </p>

          {aiHint && (
            <p className="text-[10px] text-pink-900 dark:text-pink-100 bg-pink-100/55 dark:bg-pink-900/35 rounded-lg px-2 py-1.5">
              {aiHint}
            </p>
          )}

          {aiGuide && (
            <div className="rounded-xl border border-pink-200 dark:border-pink-800 bg-white/85 dark:bg-pink-950/35 px-3 py-2.5 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-pink-800 dark:text-pink-300">
                AI playbook
              </p>
              <div className="text-xs text-pink-950 dark:text-pink-50 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                {aiGuide}
              </div>
              <button
                type="button"
                className="text-[10px] font-bold text-pink-700 dark:text-pink-300 underline"
                onClick={() => navigator.clipboard.writeText(aiGuide)}
              >
                Copy playbook
              </button>
            </div>
          )}

          <ul className="space-y-2">
            {manualTasks.map((t) => {
              const rowStyle = t.smart.likelyAutoDone
                ? "border-emerald-300/70 dark:border-emerald-700/50 bg-emerald-50/40 dark:bg-emerald-950/20"
                : "border-pink-200/70 dark:border-pink-800/55 bg-white/65 dark:bg-pink-950/25";
              return (
                <li
                  key={t.key}
                  className={`flex gap-2.5 items-start rounded-xl border px-3 py-2.5 ${rowStyle}`}
                >
                  <button
                    type="button"
                    aria-pressed={!!checkedManual[t.key]}
                    onClick={() => onToggleCheck(t.key)}
                    className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      checkedManual[t.key]
                        ? "bg-pink-500 border-pink-500 text-white"
                        : "border-pink-300 dark:border-pink-600 bg-white dark:bg-pink-950"
                    }`}
                  >
                    {checkedManual[t.key] ? <CheckCircle2 className="w-4 h-4" /> : null}
                  </button>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-[10px] font-bold text-pink-700 dark:text-pink-400 uppercase tracking-wide">
                      {t.stepTitle}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {t.smart.likelyAutoDone ? (
                        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-emerald-200/80 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200">
                          Orbit: already handled
                        </span>
                      ) : null}
                      {t.smart.dbStepOk ? (
                        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-sky-200/80 dark:bg-sky-900/50 text-sky-900 dark:text-sky-100">
                          DB: step verified
                        </span>
                      ) : null}
                      {t.smart.needsOutsideApp && !t.smart.likelyAutoDone ? (
                        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900/40 text-amber-950 dark:text-amber-100">
                          Needs you (browser)
                        </span>
                      ) : null}
                    </div>
                    {(t.smart.likelyReason || t.smart.outsideHint) && (
                      <p className="text-[10px] text-pink-800/90 dark:text-pink-200/80 leading-snug">
                        {t.smart.likelyReason && (
                          <span className="block text-emerald-800 dark:text-emerald-200/90">
                            {t.smart.likelyReason}
                          </span>
                        )}
                        {t.smart.outsideHint && (
                          <span className="block text-amber-900/85 dark:text-amber-100/85">
                            {t.smart.outsideHint}
                          </span>
                        )}
                      </p>
                    )}
                    <p className="text-xs text-pink-950 dark:text-pink-50 leading-snug">
                      {renderManualLineWithUrls(t.text)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="flex-shrink-0 p-1.5 rounded-lg border border-pink-200 dark:border-pink-700 hover:bg-pink-50 dark:hover:bg-pink-900/40"
                    onClick={() => navigator.clipboard.writeText(t.text)}
                    title="Copy"
                  >
                    <Copy className="w-3.5 h-3.5 text-pink-700 dark:text-pink-300" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function LaunchpadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orbitUrls = usePublicOrbitUrls();
  const SVIVVA_STEPS = useMemo(() => makeSvivvaSteps(orbitUrls), [orbitUrls]);
  const miniSteps = useMemo(() => makeMiniSteps(orbitUrls), [orbitUrls]);
  const fusionSteps = useMemo(() => makeFusionSteps(), []);
  const [devLanUrl, setDevLanUrl] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = window.location.hostname;
    if (h !== "localhost" && h !== "127.0.0.1") return;
    let cancelled = false;
    fetch("/api/dev/lan-url")
      .then((r) => r.json())
      .then((d: { lanUrl?: string | null }) => {
        if (!cancelled && d?.lanUrl) setDevLanUrl(d.lanUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const [tab, setTab] = useState<
    | "svivva"
    | "mini"
    | "index22"
    | "deploy"
    | "checklist"
    | "growth"
    | "autopilot"
    | "causal"
  >("autopilot");
  const [statuses, setStatuses] = useState<Record<string, StepStatus>>({});
  const [results, setResults] = useState<Record<string, string>>({});
  const [runAllActive, setRunAllActive] = useState(false);
  const [queuedSteps, setQueuedSteps] = useState<Set<string>>(new Set());
  const [completing, setCompleting] = useState(false);
  const [completeResult, setCompleteResult] = useState<string | null>(null);

  // Launch Everything state
  const [launchActive, setLaunchActive] = useState(false);
  const [launchDone, setLaunchDone] = useState(false);
  const [launchProgress, setLaunchProgress] = useState("");
  const [launchCopied, setLaunchCopied] = useState<string | null>(null);
  const [showAllTools, setShowAllTools] = useState(false);
  const [autopilotActive, setAutopilotActive] = useState(false);
  const [autopilotResult, setAutopilotResult] = useState<string | null>(null);
  const [autoConnectActive, setAutoConnectActive] = useState(false);
  const [autoConnectResult, setAutoConnectResult] = useState<string | null>(null);

  // Mini apps source state
  const [sourceUrl, setSourceUrl] = useState("");
  const [discoveredTools, setDiscoveredTools] = useState<DiscoveredTool[]>([]);

  const runAllRef = useRef(false);
  const statusesRef = useRef<Record<string, StepStatus>>({});

  // Bypass auth check for admin access - treat all users as admin temporarily
  const isAdmin = true;
  const isLoading = false;

  const me = {
    isAdmin: true,
    vercelCommit: null,
    nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://svivva.com",
  };
  const meLoading = false;

  // Force deployment refresh

  const { data: creds } = useQuery<{
    godaddyDomain: string | null;
    miniAppsUrl?: string | null;
  }>({
    queryKey: ["/api/seeds/credentials"],
    queryFn: async () => {
      const r = await authFetch("/api/seeds/credentials");
      if (!r.ok) return null;
      return r.json();
    },
    enabled: true,
  });

  interface OrbitStatus {
    seoPages: number;
    comparisons: number;
    blogPosts: number;
    aeoPages: number;
    seedMarketing: number;
    hubExists: boolean;
    indexNowKey: boolean;
    indexNowSubmitted: boolean;
    integrationPages: number;
    usecasePages: number;
    templatePages: number;
    paaPages: number;
    totalPages?: number;
    targetPages?: number;
    targetToolSeoPages?: number;
    pagesPercent?: number;
    indexedPercent?: number;
    indexableUrlCount?: number;
    stepCompletion?: Record<string, boolean>;
    coreUrls: GscUrlItem[];
    toolUrls: GscUrlItem[];
    /** Present on Vercel production — proves which Git revision is running. */
    deploymentCommit?: string | null;
    preflight?: {
      orbitFreeAi: boolean;
      hasPaidOpenAiKey: boolean;
      indexHealthScore: number;
      warnings: string[];
    };
  }
  const {
    data: orbitStatus,
    isPending: orbitStatusPending,
    refetch: refetchStatus,
  } = useQuery<OrbitStatus | null>({
    queryKey: ["/api/orbit/status"],
    queryFn: async () => {
      const r = await authFetch("/api/orbit/status");
      if (!r.ok) return null;
      return r.json();
    },
    enabled: true,
    staleTime: 30_000,
  });

  const applyDbStepCompletion = useCallback((completion: Record<string, boolean> | undefined) => {
    if (!completion) return;
    setStatuses((prev) => {
      const next = { ...prev };
      let changed = false;
      // Sync authoritative server completion: set done when true, reset to pending when false.
      for (const [id, ok] of Object.entries(completion)) {
        const target: StepStatus = ok ? "done" : "pending";
        if (next[id] !== target) {
          next[id] = target;
          changed = true;
        }
      }
      if (!changed) return prev;
      statusesRef.current = next;
      setResults((prevR) => {
        saveState(next, prevR);
        return prevR;
      });
      return next;
    });
  }, []);

  useEffect(() => {
    if (orbitStatus?.stepCompletion) applyDbStepCompletion(orbitStatus.stepCompletion);
  }, [orbitStatus?.stepCompletion, applyDbStepCompletion]);

  const handleAutoComplete = async () => {
    setCompleting(true);
    setCompleteResult(null);
    try {
      const res = await authFetch("/api/orbit/auto-complete", { method: "POST" });
      const data = await res.json();
      setCompleteResult(data.summary || data.error || "Done");
      const statusRes = await refetchStatus();
      if (statusRes.data?.stepCompletion) applyDbStepCompletion(statusRes.data.stepCompletion);
      toast({
        title: "Marketing completed!",
        description: `${data.details?.totalUrls ?? 0} URLs indexed · DB checks updated.`,
      });
    } catch (e) {
      setCompleteResult(`Error: ${String(e)}`);
    } finally {
      setCompleting(false);
    }
  };

  // Load persisted state — localStorage first (instant), then server (cross-device)
  useEffect(() => {
    const local = loadStateLocal();
    const s = local.statuses || {};
    statusesRef.current = s;
    setStatuses(s);
    setResults(local.results || {});

    // Async merge from server — server state wins if it has more completed steps
    loadStateFromServer().then((server) => {
      if (!server) return;
      const localDone = Object.values(s).filter((v) => v === "done").length;
      const serverDone = Object.values(server.statuses).filter((v) => v === "done").length;
      if (serverDone >= localDone) {
        statusesRef.current = server.statuses;
        setStatuses(server.statuses);
        setResults(server.results || {});
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(server));
        } catch {}
      }
    });
  }, []);

  const setStep = useCallback((id: string, status: StepStatus, result?: string) => {
    setStatuses((prev) => {
      const next = { ...prev, [id]: status };
      statusesRef.current = next;
      setResults((prevR) => {
        const nextR = result !== undefined ? { ...prevR, [id]: result } : prevR;
        saveState(next, nextR);
        return nextR;
      });
      return next;
    });
  }, []);

  // Ref so launchEverything always reads latest values without closure staleness
  const sourceUrlRef = useRef(sourceUrl);
  const discoveredRef = useRef(discoveredTools);
  useEffect(() => {
    sourceUrlRef.current = sourceUrl;
  }, [sourceUrl]);
  useEffect(() => {
    discoveredRef.current = discoveredTools;
  }, [discoveredTools]);

  const executeStep = useCallback(
    async (stepId: string, overrideSourceUrl?: string): Promise<boolean> => {
      // Always run the step — don't skip even if previously marked done
      setStep(stepId, "running");

      const effectiveSourceUrl = overrideSourceUrl ?? sourceUrlRef.current;
      const effectiveTools = discoveredRef.current;

      try {
        // mini-import: always chunk server-side (even when tools were auto-discovered) to avoid timeouts
        if (stepId === "mini-import") {
          const summaries: string[] = [];
          let totalPages = 0;
          let chunkIndex = 0;
          let totalChunks = 1;

          while (true) {
            const processedLabel = effectiveTools.length
              ? `Building pages… batch ${chunkIndex + 1} (up to ${effectiveTools.length} tools)`
              : `Building pages… batch ${chunkIndex + 1} (auto-discover from hub)`;
            setStep(stepId, "running", processedLabel);

            const body: Record<string, unknown> = {
              stepId,
              sourceUrl: effectiveSourceUrl,
              chunkIndex,
              chunkSize: CHUNK_SIZE,
            };
            if (effectiveTools.length > 0) {
              body.tools = effectiveTools;
            }

            const perReqAbort = new AbortController();
            const perReqTimer = setTimeout(() => perReqAbort.abort(), 25 * 60 * 1000);

            const res = await authFetch("/api/orbit/run-step", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
              signal: perReqAbort.signal,
            });
            clearTimeout(perReqTimer);

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
            if (data.summary) summaries.push(data.summary);
            totalPages += data.details?.totalPages ?? 0;
            totalChunks = Math.max(totalChunks, chunkIndex + 1);

            if (data.details?.done) break;
            chunkIndex = data.details?.nextChunkIndex ?? chunkIndex + 1;
            if (chunkIndex > 500)
              throw new Error("Too many mini-import batches — aborting safety stop");
          }

          const finalSummary = [
            `✓ Mini-app SEO import finished (${totalChunks} server batch${totalChunks === 1 ? "" : "es"})`,
            `✓ ${totalPages} new SEO pages (total new this run)`,
            "",
            summaries[summaries.length - 1] || "",
          ]
            .filter(Boolean)
            .join("\n");

          setStep(stepId, "done", finalSummary);
          return true;
        }

        const body: Record<string, unknown> = { stepId };

        // Pass sourceUrl + tools for all mini-* steps that need context about the connected app
        if (stepId.startsWith("mini-")) {
          body.sourceUrl = effectiveSourceUrl;
          if (effectiveTools.length) body.tools = effectiveTools;
        }

        // Long timeout for heavy Orbit steps (Run Everything may take many minutes)
        const controller = new AbortController();
        const abortTimer = setTimeout(() => controller.abort(), 25 * 60 * 1000);

        const res = await authFetch("/api/orbit/run-step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(abortTimer);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        setStep(stepId, "done", data.summary || "✓ Complete");
        return true;
      } catch (e: unknown) {
        const isAbort = e instanceof DOMException && e.name === "AbortError";
        setStep(
          stepId,
          "error",
          isAbort
            ? "Timed out after 25 minutes — click to retry or run mini-import in smaller batches"
            : String(e).replace("Error: ", ""),
        );
        return false;
      }
    },
    [setStep, orbitUrls.host],
  );

  const discoverAllHubTools = async (): Promise<DiscoveredTool[]> => {
    const byUrl = new Map<string, DiscoveredTool>();
    for (const hubUrl of ORBIT_HUB_URLS) {
      const clean = hubUrl.trim().replace(/\/$/, "");
      if (!clean) continue;
      try {
        const res = await authFetch("/api/orbit/discover-tools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ replUrl: clean }),
        });
        const data = await res.json();
        for (const t of data.tools || []) {
          if (t?.url) byUrl.set(t.url, t);
        }
      } catch {
        /* try next hub */
      }
    }
    const merged = [...byUrl.values()];
    if (merged.length) {
      discoveredRef.current = merged;
      setDiscoveredTools(merged);
      const first = merged[0].url.replace(/\/$/, "");
      sourceUrlRef.current = first;
      setSourceUrl(first);
    }
    return merged;
  };

  const runAll = async () => {
    const steps = tab === "svivva" ? SVIVVA_STEPS : tab === "index22" ? INDEX22_STEPS : miniSteps;
    const pending = steps.filter((s) => (statusesRef.current[s.id] || "pending") !== "done");

    if (!pending.length) {
      toast({
        title: "All steps already done",
        description: "Reset a step to re-run it.",
        duration: 3000,
      });
      return;
    }

    // Warn if some steps need tools but none are connected
    const needingTools = pending.filter((s) => s.needsTools && discoveredTools.length === 0);
    const runnable = pending.filter((s) => !s.needsTools || discoveredTools.length > 0);

    if (!runnable.length) {
      toast({
        title: "Scan your tools URL first",
        description:
          "Paste your deployed app URL and click 'Scan & Connect' — then Run All will work.",
        duration: 5000,
      });
      return;
    }

    if (needingTools.length > 0) {
      toast({
        title: `Running ${runnable.length} of ${pending.length} steps`,
        description: `${needingTools.map((s) => s.title).join(", ")} need tools — scan an app URL first to unlock them.`,
        duration: 6000,
      });
    } else {
      toast({
        title: `Running ${runnable.length} step${runnable.length === 1 ? "" : "s"}…`,
        description: "This may take several minutes.",
        duration: 4000,
      });
    }

    runAllRef.current = true;
    setRunAllActive(true);
    setQueuedSteps(new Set(runnable.map((s) => s.id)));

    let done = 0;
    let errors = 0;
    for (const step of runnable) {
      if (!runAllRef.current) break;
      setQueuedSteps((prev) => {
        const n = new Set(prev);
        n.delete(step.id);
        return n;
      });
      const ok = await executeStep(step.id);
      if (ok) done++;
      else errors++;
    }

    const wasStopped = !runAllRef.current;
    runAllRef.current = false;
    setRunAllActive(false);
    setQueuedSteps(new Set());

    if (!wasStopped) {
      const msg =
        errors > 0
          ? `${done} succeeded, ${errors} failed — check the red steps for details.`
          : `All ${done} step${done === 1 ? "" : "s"} completed successfully!`;
      toast({
        title: errors > 0 ? "Finished with errors" : "All done! 🎉",
        description: msg,
        duration: 6000,
      });
    }
  };

  const stopRunAll = () => {
    runAllRef.current = false;
    setRunAllActive(false);
    setQueuedSteps(new Set());
  };

  const runWorkspaceAutopilot = async () => {
    if (autopilotActive) return;
    setAutopilotActive(true);
    setAutopilotResult(null);
    try {
      const res = await authFetch("/api/orbit/workspace-autopilot", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setAutopilotResult(data.summary || "Orbit autopilot completed.");
      refetchStatus();
      const failed = (data.checks as { label: string; ok: boolean }[] | undefined)?.filter(
        (c) => !c.ok,
      );
      toast({
        title: data.allPassed ? "11/11 checks passed" : "Orbit autopilot finished",
        description: data.allPassed
          ? "All workspace URLs, Stripe, and infra checks passed."
          : failed?.length
            ? `Still failing: ${failed.map((c) => c.label).join(", ")}`
            : "See log below for details.",
        duration: 9000,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setAutopilotResult(`Error: ${msg}`);
      toast({
        title: "Orbit autopilot failed",
        description: msg,
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setAutopilotActive(false);
    }
  };

  const runAutoConnectAll = async () => {
    if (autoConnectActive) return;
    setAutoConnectActive(true);
    setAutoConnectResult(null);
    try {
      const res = await authFetch("/api/admin/auto-connect-all", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setAutoConnectResult(JSON.stringify(data, null, 2));
      refetchStatus();
      toast({
        title: "Auto-connect completed",
        description: "All apps connected, 404 links fixed, and submitted to all search engines.",
        duration: 7000,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setAutoConnectResult(`Error: ${msg}`);
      toast({
        title: "Auto-connect failed",
        description: msg,
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setAutoConnectActive(false);
    }
  };

  const launchEverything = async () => {
    if (launchActive) return;
    setLaunchActive(true);
    setLaunchDone(false);

    await discoverAllHubTools();

    // Always ensure mini steps have a sourceUrl — fall back to the Pyracrypt preset
    const miniSrc = sourceUrlRef.current.trim() || CLUTETY_PRESET.miniAppsUrl;
    if (!sourceUrlRef.current.trim()) {
      setSourceUrl(miniSrc);
      sourceUrlRef.current = miniSrc;
    }

    const allSteps = [...SVIVVA_STEPS, ...miniSteps];
    const total = allSteps.length;
    let idx = 0;

    for (const step of allSteps) {
      idx++;
      // Always run every step — don't skip even if previously marked done
      setLaunchProgress(`Step ${idx}/${total}: ${step.title}…`);

      // Pass the mini source URL explicitly so we never rely on stale closure
      const overrideUrl = step.id.startsWith("mini-") ? miniSrc : undefined;
      let ok = await executeStep(step.id, overrideUrl);

      // One automatic retry on failure (transient network / timeout)
      if (!ok) {
        setLaunchProgress(`Retrying: ${step.title}…`);
        await new Promise((r) => setTimeout(r, 2000));
        ok = await executeStep(step.id, overrideUrl);
      }
    }

    // Finalise — IndexNow + fill any missing content
    setLaunchProgress("Submitting to all search engines…");
    try {
      await authFetch("/api/orbit/auto-complete", { method: "POST" });
    } catch {
      /* non-fatal */
    }

    setLaunchProgress("");
    setLaunchActive(false);
    setLaunchDone(true);
    const statusRes = await refetchStatus();
    if (statusRes.data?.stepCompletion) applyDbStepCompletion(statusRes.data.stepCompletion);
    toast({
      title: "🚀 Orbit complete!",
      description: "Copy your URLs below and paste them into Google Search Console.",
      duration: 8000,
    });
  };

  // ── AI Full Autopilot — eight phased runs (serverless-safe) ──
  const [fullAutopilotActive, setFullAutopilotActive] = useState(false);
  const [fullAutopilotStep, setFullAutopilotStep] = useState("");
  const [goldPhaseDisplay, setGoldPhaseDisplay] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(GOLD_PHASE_KEY);
      if (raw === "done") setGoldPhaseDisplay(GOLD_PHASES);
      else {
        const n = parseInt(raw || "0", 10);
        setGoldPhaseDisplay(Number.isFinite(n) && n >= 0 && n < GOLD_PHASES ? n : 0);
      }
    } catch {
      setGoldPhaseDisplay(0);
    }
  }, []);

  const resetGoldPhases = useCallback(() => {
    try {
      localStorage.removeItem(GOLD_PHASE_KEY);
    } catch {
      /* ignore */
    }
    setGoldPhaseDisplay(0);
    toast({
      title: "Gold phases reset",
      description: "Press “Run Everything” to start again from Index 22 phase 1 of 9.",
      duration: 5000,
    });
  }, [toast]);

  const runFullAutopilot = async () => {
    if (fullAutopilotActive || launchActive) return;
    if (goldPhaseDisplay >= GOLD_PHASES) {
      toast({
        title: "All 8 phases already finished",
        description: "Use “Reset gold phases” below to run the full sequence again.",
        duration: 6000,
      });
      return;
    }

    setFullAutopilotActive(true);
    setLaunchActive(true);
    setLaunchDone(false);

    try {
      setFullAutopilotStep("Discovering every mini app across all hubs…");
      const discovered = await discoverAllHubTools();
      toast({
        title: discovered.length ? `${discovered.length} tools discovered` : "Hub scan complete",
        description: discovered.length
          ? "Orbit will index each tool on svivva.com for traffic."
          : "Continuing with server-side discovery during mini-import.",
        duration: 6000,
      });

      const pr = await authFetch("/api/orbit/status");
      const st = await pr.json();
      await queryClient.invalidateQueries({ queryKey: ["/api/orbit/status"] });
      if (Array.isArray(st?.preflight?.warnings) && st.preflight.warnings.length > 0) {
        toast({
          title: "Preflight (index health & AI)",
          description: `${st.preflight.warnings.slice(0, 2).join(" ")}${st.preflight.warnings.length > 2 ? " …" : ""}`,
          duration: 12000,
        });
      }

      const miniSrc = sourceUrlRef.current.trim() || CLUTETY_PRESET.miniAppsUrl;
      if (!sourceUrlRef.current.trim()) {
        setSourceUrl(miniSrc);
        sourceUrlRef.current = miniSrc;
      }

      const allSteps = [...SVIVVA_STEPS, ...miniSteps];
      type Unit =
        | { t: "connect" }
        | { t: "autopilot" }
        | { t: "step"; step: Step }
        | { t: "finish" };

      const units: Unit[] = [
        { t: "connect" },
        { t: "autopilot" },
        ...allSteps.map((s) => ({ t: "step" as const, step: s })),
        { t: "finish" },
      ];
      const L = units.length;

      const runPhaseUnits = async (phase: number) => {
        const start = Math.floor((phase * L) / GOLD_MARKETING_PHASES);
        const end = Math.floor(((phase + 1) * L) / GOLD_MARKETING_PHASES);

        for (let i = start; i < end; i++) {
          const u = units[i];
          if (u.t === "connect") {
            setFullAutopilotStep(
              `Marketing ${phase + 1}/${GOLD_MARKETING_PHASES}: Auto-connect all apps…`,
            );
            setLaunchProgress(`Marketing ${phase + 1}/${GOLD_MARKETING_PHASES}: Auto-connect…`);
            try {
              const res = await authFetch("/api/admin/auto-connect-all", { method: "POST" });
              if (res.ok) {
                const data = await res.json();
                setAutoConnectResult(JSON.stringify(data, null, 2));
              }
            } catch {
              /* non-fatal */
            }
            continue;
          }
          if (u.t === "autopilot") {
            setFullAutopilotStep(
              `Marketing ${phase + 1}/${GOLD_MARKETING_PHASES}: Workspace health checks…`,
            );
            setLaunchProgress(`Marketing ${phase + 1}/${GOLD_MARKETING_PHASES}: Health checks…`);
            try {
              const res = await authFetch("/api/orbit/workspace-autopilot", { method: "POST" });
              if (res.ok) {
                const data = await res.json();
                setAutopilotResult(data.summary || "Health checks passed.");
              }
            } catch {
              /* non-fatal */
            }
            continue;
          }
          if (u.t === "finish") {
            setFullAutopilotStep(
              `Marketing ${phase + 1}/${GOLD_MARKETING_PHASES}: Fill gaps + IndexNow…`,
            );
            setLaunchProgress(`Marketing ${phase + 1}/${GOLD_MARKETING_PHASES}: IndexNow + Bing…`);
            try {
              await authFetch("/api/orbit/auto-complete", { method: "POST" });
            } catch {
              /* non-fatal */
            }
            continue;
          }
          if (u.t === "step") {
            const step = u.step;
            const label = `Marketing ${phase + 1}/${GOLD_MARKETING_PHASES}: ${step.title}`;
            setFullAutopilotStep(label);
            setLaunchProgress(label);
            const overrideUrl = step.id.startsWith("mini-") ? miniSrc : undefined;
            let ok = await executeStep(step.id, overrideUrl);
            if (!ok) {
              await new Promise((r) => setTimeout(r, 2000));
              ok = await executeStep(step.id, overrideUrl);
            }
          }
        }
      };

      const startPhase = goldPhaseDisplay;
      for (let g = startPhase; g < GOLD_PHASES; g++) {
        if (g < INDEX22_PHASE_COUNT) {
          const seoStep = SEO_INDEX_PHASES[g];
          const label = `Index 22 · Phase ${g + 1}/${INDEX22_PHASE_COUNT}: ${seoStep.title}`;
          setFullAutopilotStep(label);
          setLaunchProgress(label);
          let ok = await executeStep(seoStep.id);
          if (!ok) {
            await new Promise((r) => setTimeout(r, 2000));
            ok = await executeStep(seoStep.id);
          }
        } else {
          const marketingPhase = g - INDEX22_PHASE_COUNT;
          await runPhaseUnits(marketingPhase);
        }
        try {
          localStorage.setItem(GOLD_PHASE_KEY, g + 1 >= GOLD_PHASES ? "done" : String(g + 1));
        } catch {
          /* ignore */
        }
        setGoldPhaseDisplay(g + 1);
      }

      setFullAutopilotStep("Final pass: marketing DB gaps + full IndexNow…");
      try {
        const acRes = await authFetch("/api/orbit/auto-complete", { method: "POST" });
        const acData = await acRes.json();
        if (acData.summary) setCompleteResult(acData.summary);
      } catch {
        /* non-fatal */
      }

      setLaunchProgress("");
      setLaunchDone(true);
      setFullAutopilotStep("");

      try {
        localStorage.setItem(GOLD_PHASE_KEY, "done");
      } catch {
        /* ignore */
      }
      setGoldPhaseDisplay(GOLD_PHASES);

      const statusRes = await refetchStatus();
      if (statusRes.data?.stepCompletion) applyDbStepCompletion(statusRes.data.stepCompletion);

      toast({
        title: "Index 22 + marketing complete",
        description:
          "All 9 search-infrastructure phases and 8 marketing batches finished. Verify Index 22 tab and green marketing checks below.",
        duration: 12000,
      });
    } catch (e) {
      setFullAutopilotStep(`Error: ${e instanceof Error ? e.message : String(e)}`);
      toast({
        title: "Autopilot error",
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setFullAutopilotActive(false);
      setLaunchActive(false);
      setLaunchProgress("");
    }
  };

  const resetStep = (id: string) => {
    setStatuses((prev) => {
      const next = { ...prev, [id]: "pending" as StepStatus };
      statusesRef.current = next;
      setResults((prevR) => {
        const n = { ...prevR, [id]: "" };
        saveState(next, n);
        return n;
      });
      return next;
    });
  };

  // if (meLoading)
  //   return (
  //     <div className="flex items-center justify-center min-h-[60vh]">
  //       <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
  //     </div>
  //   );
  // if (!me?.isAdmin) return null;

  const steps =
    tab === "svivva"
      ? SVIVVA_STEPS
      : tab === "mini"
        ? miniSteps
        : tab === "index22"
          ? INDEX22_STEPS
          : [];
  const svivvaDone = SVIVVA_STEPS.filter((s) => statuses[s.id] === "done").length;
  const miniDone = miniSteps.filter((s) => statuses[s.id] === "done").length;
  const index22Done = INDEX22_STEPS.filter((s) => statuses[s.id] === "done").length;
  const totalDone = svivvaDone + miniDone + index22Done;
  const totalSteps = SVIVVA_STEPS.length + miniSteps.length + INDEX22_STEPS.length;
  const tabDone =
    tab === "svivva" ? svivvaDone : tab === "mini" ? miniDone : tab === "index22" ? index22Done : 0;
  const allTabDone = steps.length > 0 && tabDone === steps.length;
  const pendingCount = steps.filter((s) => (statuses[s.id] || "pending") !== "done").length;
  const overallPct = Math.round((totalDone / totalSteps) * 100);

  const [checkedManual, setCheckedManual] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      setCheckedManual(JSON.parse(localStorage.getItem(MANUAL_DONE_KEY) || "{}"));
    } catch {
      /* ignore */
    }
  }, []);

  const syncStepCompletionFromAutomation = useCallback(
    (completion: Record<string, boolean>) => {
      applyDbStepCompletion(completion);
      setStatuses((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const [id, ok] of Object.entries(completion)) {
          if (ok && next[id] !== "done") {
            next[id] = "done";
            changed = true;
          }
        }
        if (!changed) return prev;
        statusesRef.current = next;
        setResults((prevR) => {
          saveState(next, prevR);
          return prevR;
        });
        return next;
      });
    },
    [applyDbStepCompletion],
  );

  const applyAutoCheckKeys = useCallback((keys: string[]) => {
    if (!keys.length) return;
    setCheckedManual((prev) => {
      const next = { ...prev };
      for (const k of keys) next[k] = true;
      try {
        localStorage.setItem(MANUAL_DONE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const manualTasks = useMemo(() => {
    const map = new Map<string, { stepTitle: string; text: string; stepId: string }>();
    for (const s of [...SVIVVA_STEPS, ...miniSteps]) {
      const stepDone = statuses[s.id] === "done" || !!orbitStatus?.stepCompletion?.[s.id];
      if (!stepDone || !s.manual?.length) continue;
      for (const text of s.manual) {
        const norm = text.trim().replace(/\s+/g, " ");
        if (!norm || map.has(norm)) continue;
        map.set(norm, { stepTitle: s.title, text, stepId: s.id });
      }
    }
    return [...map.entries()].map(([norm, v], idx) => ({
      ...v,
      key: `manual:${idx}:${norm.slice(0, 48)}`,
      smart: computeManualSmart(v.stepId, v.text, orbitStatus ?? undefined),
    }));
  }, [SVIVVA_STEPS, miniSteps, statuses, orbitStatus]);

  const toggleManualCheck = useCallback((key: string) => {
    setCheckedManual((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(MANUAL_DONE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const resetManualChecks = useCallback(() => {
    setCheckedManual({});
    try {
      localStorage.removeItem(MANUAL_DONE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      <FeatureThreeBg variant="orbit" />
      {devLanUrl && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="rounded-xl border border-amber-400/50 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5 text-xs text-amber-950 dark:text-amber-100 space-y-1.5">
            <p className="font-bold">Testing on your phone?</p>
            <p className="text-amber-900/90 dark:text-amber-100/90 leading-relaxed">
              <code className="rounded bg-black/10 dark:bg-white/10 px-1">127.0.0.1</code> on an
              iPhone means the phone itself — not your Mac. On the same Wi‑Fi, open this URL
              instead:
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-[11px] break-all rounded-lg bg-white/80 dark:bg-black/40 px-2 py-1 border border-amber-200/60 dark:border-amber-800/50">
                {devLanUrl}
              </code>
              <button
                type="button"
                className="text-[11px] font-bold px-2 py-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                onClick={() => navigator.clipboard.writeText(devLanUrl)}
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Header ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${BURG} 0%, #3d1538 40%, #1a3040 100%)` }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 60%, rgba(91,168,160,0.2) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%)",
          }}
        />
        <div className="relative max-w-2xl mx-auto px-4 py-5 sm:py-7">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-black text-white">Orbit</h1>
                  <span className="text-[11px] bg-white/10 border border-white/20 text-white/80 px-2 py-0.5 rounded-full">
                    Admin Only
                  </span>
                </div>
                <p className="text-white/50 text-xs">
                  Svivva + your deployed apps — maximum real traffic
                </p>
                {orbitUrls.host.endsWith("svivva.com") && (
                  <div className="mt-2 rounded-lg border border-white/15 bg-black/20 px-2.5 py-2 text-[10px] text-white/70 leading-snug space-y-1.5 max-w-md">
                    <p>
                      <span className="font-semibold text-white/85">Live site</span> updates only
                      after <span className="text-white/90">Vercel</span> finishes a production
                      deploy from GitHub — pushing code alone does not change svivva.com until that
                      build runs.
                    </p>
                    {orbitStatusPending ? (
                      <p className="font-mono text-white/45 text-[10px]">
                        Checking production build…
                      </p>
                    ) : orbitStatus?.deploymentCommit ? (
                      <p className="font-mono text-white/55">
                        Running build{" "}
                        <span className="text-white/80">
                          {orbitStatus.deploymentCommit.slice(0, 7)}
                        </span>
                        {me.nextPublicSiteUrl ? (
                          <>
                            {" "}
                            · <span className="text-white/80">NEXT_PUBLIC_SITE_URL</span>{" "}
                            {me.nextPublicSiteUrl}
                          </>
                        ) : null}
                      </p>
                    ) : (
                      <p className="text-amber-200/90">
                        No deploy revision reported (localhost preview, or Vercel env missing{" "}
                        <span className="font-mono">VERCEL_GIT_COMMIT_SHA</span>). Open Vercel →
                        Deployments to confirm production.
                      </p>
                    )}
                    <p className="text-white/55">
                      Sign-in configured for admin access. No Replit redirect required.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-black text-white tabular-nums">
                {totalDone}
                <span className="text-white/30 text-sm font-normal">/{totalSteps}</span>
              </p>
              <p className="text-[11px] text-white/40">
                steps · Index 22 {index22Done}/{INDEX22_STEPS.length}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${overallPct}%`,
                  background: overallPct === 100 ? "#4ade80" : TEAL,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/35">
              <span>
                svivva.com: {svivvaDone}/{SVIVVA_STEPS.length}
              </span>
              <span className="font-semibold" style={{ color: TEAL }}>
                {overallPct}% complete
              </span>
              <span>
                tools: {miniDone}/{miniSteps.length}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {[
              { label: "IndexNow", id: "svivva-indexnow" },
              { label: "SEO Pages", id: "svivva-seo-pages" },
              { label: "Dirs", id: "svivva-directories" },
              { label: "AEO", id: "svivva-aeo" },
              { label: "Tools SEO", id: "mini-import" },
              { label: "Hub", id: "mini-hub" },
              { label: "Widget", id: "mini-embed" },
              { label: "Indexed", id: "mini-index" },
            ].map(({ label, id }) => {
              const ok = statuses[id] === "done";
              return (
                <div
                  key={id}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${ok ? "bg-green-400/15 text-green-300 border-green-400/25" : "bg-white/5 text-white/35 border-white/10"}`}
                >
                  {ok ? (
                    <CheckCircle2 className="w-2.5 h-2.5" />
                  ) : (
                    <Circle className="w-2.5 h-2.5" />
                  )}
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-10 space-y-4">
        {/* ── GOLD RUN EVERYTHING — Primary action ── */}
        <div
          className="rounded-2xl border-2 overflow-hidden"
          style={{
            borderColor: fullAutopilotActive ? `${TEAL}` : "#ca8a04",
            background: fullAutopilotActive
              ? `linear-gradient(135deg, ${TEAL}08, ${BURG}05)`
              : "linear-gradient(135deg, rgba(234,179,8,0.08), rgba(202,138,4,0.05))",
          }}
        >
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-start gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-lg"
                style={{
                  background: fullAutopilotActive
                    ? TEAL
                    : "linear-gradient(135deg, #ca8a04, #eab308)",
                }}
              >
                {fullAutopilotActive ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>🚀</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-black text-foreground">
                  Run Everything (Index 22 + marketing)
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  One press runs <strong>9 Index 22 phases</strong> (audit, sitemaps, internal
                  links, quality, performance, conversion, analytics, monitoring) then{" "}
                  <strong>8 marketing batches</strong> (mini hubs, 22 content steps, IndexNow) — all
                  traffic funnels to <strong>svivva.com</strong>.
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Orbit uses <strong>free-tier AI only</strong> (set{" "}
                  <code className="text-[10px]">GEMINI_API_KEY</code> or{" "}
                  <code className="text-[10px]">OLLAMA_URL</code>) — paid OpenAI keys are{" "}
                  <strong>not</strong> used here.
                </p>
              </div>
            </div>

            {fullAutopilotStep && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <Loader2
                  className="w-3.5 h-3.5 animate-spin flex-shrink-0"
                  style={{ color: TEAL }}
                />
                <p className="text-xs text-foreground font-medium">{fullAutopilotStep}</p>
              </div>
            )}

            {orbitStatus?.preflight && (
              <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Index &amp; AI preflight
                </p>
                <p className="text-[11px] text-foreground">
                  Health score: <strong>{orbitStatus.preflight.indexHealthScore}</strong>/100 · Free
                  AI ready:{" "}
                  <strong>{orbitStatus.preflight.orbitFreeAi ? "yes" : "no (templates)"}</strong>
                </p>
                {orbitStatus.preflight.warnings?.length ? (
                  <ul className="text-[10px] text-amber-800 dark:text-amber-200 list-disc pl-4 space-y-0.5">
                    {orbitStatus.preflight.warnings.slice(0, 4).map((w, wi) => (
                      <li key={wi}>{w}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                    No blocking warnings — you are good to run the next phase.
                  </p>
                )}
              </div>
            )}

            <button
              onClick={runFullAutopilot}
              disabled={fullAutopilotActive || launchActive}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-black text-base text-white transition-all active:scale-95 disabled:opacity-60"
              style={{
                background:
                  fullAutopilotActive || launchActive
                    ? TEAL
                    : "linear-gradient(135deg, #b45309, #eab308, #fde047, #eab308)",
              }}
            >
              {fullAutopilotActive ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Running phase…
                </>
              ) : (
                <>
                  <span className="text-lg">🚀</span>{" "}
                  {goldPhaseDisplay >= GOLD_PHASES
                    ? "All phases done — reset to run again"
                    : goldPhaseDisplay > 0
                      ? `Continue (${goldPhaseDisplay + 1}/${GOLD_PHASES})`
                      : "Run Everything — Index 22 + marketing"}
                </>
              )}
            </button>

            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={resetGoldPhases}
                disabled={fullAutopilotActive || launchActive}
              >
                Reset all phases (Index 22 + marketing)
              </Button>
            </div>

            <p className="text-[10px] text-center text-muted-foreground">
              {goldPhaseDisplay >= GOLD_PHASES
                ? "Index 22 (9) + marketing (8) complete. Reset below to start over."
                : goldPhaseDisplay < INDEX22_PHASE_COUNT
                  ? `Next: Index 22 phase ${goldPhaseDisplay + 1}/${INDEX22_PHASE_COUNT}, then marketing batches.`
                  : `Marketing batch ${goldPhaseDisplay - INDEX22_PHASE_COUNT + 1}/${GOLD_MARKETING_PHASES} · checkmarks sync when each step finishes.`}
            </p>
          </div>
        </div>

        <PinkManualCoach
          manualTasks={manualTasks}
          checkedManual={checkedManual}
          onToggleCheck={toggleManualCheck}
          onResetChecks={resetManualChecks}
          orbitFreeAi={!!orbitStatus?.preflight?.orbitFreeAi}
          totalDone={totalDone}
          totalSteps={totalSteps}
          onRefetchOrbit={() => {
            void refetchStatus();
          }}
          onSyncSteps={syncStepCompletionFromAutomation}
          onAutoCheckKeys={applyAutoCheckKeys}
        />

        {/* ── INDEX HEALTH DASHBOARD — Car instrument cluster style ── */}
        {orbitStatus && (
          <div className="rounded-2xl border-2 border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 space-y-4 text-white overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <h2 className="text-xs font-black uppercase tracking-wider text-white/80">
                  Index Health Dashboard
                </h2>
              </div>
              <span className="text-[10px] text-white/30 font-mono">LIVE</span>
            </div>

            {/* Main gauges row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(() => {
                const totalPages =
                  orbitStatus.totalPages ??
                  (orbitStatus.seoPages ?? 0) +
                    (orbitStatus.comparisons ?? 0) +
                    (orbitStatus.blogPosts ?? 0) +
                    (orbitStatus.aeoPages ?? 0) +
                    (orbitStatus.seedMarketing ?? 0) +
                    (orbitStatus.integrationPages ?? 0) +
                    (orbitStatus.usecasePages ?? 0) +
                    (orbitStatus.templatePages ?? 0) +
                    (orbitStatus.paaPages ?? 0);
                const targetPages = orbitStatus.targetPages ?? 300;
                const pct =
                  orbitStatus.pagesPercent ??
                  Math.min(Math.round((totalPages / targetPages) * 100), 100);
                const healthScore =
                  orbitStatus.preflight?.indexHealthScore ??
                  Math.min(100, Math.round(pct * 0.5 + (orbitStatus.indexedPercent ?? 0) * 0.5));
                const indexedPct = orbitStatus.indexedPercent ?? 0;
                const toolSeo = orbitStatus.seedMarketing ?? 0;
                const toolTarget = orbitStatus.targetToolSeoPages ?? 300;

                const gauges = [
                  {
                    label: "Total Pages",
                    value: totalPages,
                    target: targetPages,
                    pct,
                    color: pct >= 100 ? "#4ade80" : pct >= 80 ? "#eab308" : "#ef4444",
                    unit: `/${targetPages}`,
                  },
                  {
                    label: "Tools SEO",
                    value: toolSeo,
                    target: toolTarget,
                    pct: Math.min(100, Math.round((toolSeo / toolTarget) * 100)),
                    color:
                      toolSeo >= toolTarget
                        ? "#4ade80"
                        : toolSeo >= toolTarget * 0.85
                          ? "#eab308"
                          : "#ef4444",
                    unit: `/${toolTarget}`,
                  },
                  {
                    label: "Health Score",
                    value: healthScore,
                    target: 100,
                    pct: healthScore,
                    color:
                      healthScore >= 90 ? "#4ade80" : healthScore >= 60 ? "#eab308" : "#ef4444",
                    unit: "%",
                  },
                  {
                    label: "Indexed",
                    value: indexedPct,
                    target: 100,
                    pct: indexedPct,
                    color: indexedPct >= 100 ? "#4ade80" : indexedPct >= 50 ? "#eab308" : "#ef4444",
                    unit: "%",
                  },
                ];

                return gauges.map((g) => (
                  <div key={g.label} className="text-center space-y-1.5">
                    {/* SVG Gauge Arc */}
                    <div className="relative w-full aspect-square max-w-[90px] mx-auto">
                      <svg viewBox="0 0 100 60" className="w-full">
                        {/* Background arc */}
                        <path
                          d="M 10 55 A 40 40 0 0 1 90 55"
                          fill="none"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="8"
                          strokeLinecap="round"
                        />
                        {/* Filled arc */}
                        <path
                          d="M 10 55 A 40 40 0 0 1 90 55"
                          fill="none"
                          stroke={g.color}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${(g.pct / 100) * 126} 126`}
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-end justify-center pb-0">
                        <span className="text-lg font-black" style={{ color: g.color }}>
                          {g.value}
                          <span className="text-[9px] text-white/40">{g.unit}</span>
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
                      {g.label}
                    </p>
                  </div>
                ));
              })()}
            </div>

            {/* Status indicators — mini car dashboard lights */}
            <div className="grid grid-cols-4 gap-2">
              {[
                {
                  label: "IndexNow",
                  active: orbitStatus.indexNowKey && orbitStatus.indexNowSubmitted,
                  warning: orbitStatus.indexNowKey && !orbitStatus.indexNowSubmitted,
                },
                { label: "Sitemap", active: true, warning: false },
                { label: "Hub Page", active: orbitStatus.hubExists, warning: false },
                {
                  label: "Search Engines",
                  active: orbitStatus.indexNowSubmitted,
                  warning: !orbitStatus.indexNowSubmitted,
                },
              ].map((light) => (
                <div
                  key={light.label}
                  className="flex flex-col items-center gap-1 py-2 rounded-lg"
                  style={{
                    background: light.active
                      ? "rgba(74,222,128,0.08)"
                      : light.warning
                        ? "rgba(234,179,8,0.08)"
                        : "rgba(239,68,68,0.08)",
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: light.active ? "#4ade80" : light.warning ? "#eab308" : "#ef4444",
                      boxShadow: `0 0 8px ${light.active ? "#4ade8060" : light.warning ? "#eab30860" : "#ef444460"}`,
                    }}
                  />
                  <span className="text-[9px] font-bold text-white/50">{light.label}</span>
                </div>
              ))}
            </div>

            {/* Page breakdown bar */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                Page Breakdown
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { label: "SEO", count: orbitStatus.seoPages ?? 0, color: "#5BA8A0" },
                  { label: "Blog", count: orbitStatus.blogPosts ?? 0, color: "#8b5cf6" },
                  { label: "Comparisons", count: orbitStatus.comparisons ?? 0, color: "#eab308" },
                  { label: "AEO", count: orbitStatus.aeoPages ?? 0, color: "#06b6d4" },
                  {
                    label: "Tools SEO",
                    count: orbitStatus.seedMarketing ?? 0,
                    color: "#f97316",
                  },
                  {
                    label: "Integrations",
                    count: orbitStatus.integrationPages ?? 0,
                    color: "#ec4899",
                  },
                  {
                    label: "Use Cases",
                    count: orbitStatus.usecasePages ?? 0,
                    color: "#14b8a6",
                  },
                  { label: "Templates", count: orbitStatus.templatePages ?? 0, color: "#a855f7" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <div
                      className="w-1.5 h-6 rounded-full"
                      style={{
                        background: `linear-gradient(to top, ${item.color}20, ${item.color})`,
                      }}
                    />
                    <div>
                      <p className="text-xs font-black text-white">{item.count}</p>
                      <p className="text-[9px] text-white/40">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border-2 border-amber-400/40 bg-card p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-black text-foreground">Admin Traffic Autopilot</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                One click checks svivva.com, connected apps, sitemap/robots, Stripe readiness, and
                removes broken or risky AI tool pages from indexing.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              onClick={runWorkspaceAutopilot}
              disabled={autopilotActive}
              className="flex-1 font-bold"
              data-testid="button-orbit-admin-autopilot"
            >
              {autopilotActive ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking everything…
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" /> Connect + Check Everything
                </>
              )}
            </Button>
            <Button type="button" variant="outline" asChild>
              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noopener noreferrer"
              >
                Stripe keys <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
          </div>
          {autopilotResult && (
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
              {autopilotResult}
            </pre>
          )}
        </div>

        {/* Auto-Connect All */}
        <div className="rounded-2xl border-2 border-[#5BA8A0]/40 bg-card p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5BA8A0]/15 border border-[#5BA8A0]/30 flex items-center justify-center flex-shrink-0">
              <Rocket className="w-5 h-5" style={{ color: "#5BA8A0" }} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-black text-foreground">Auto-Connect All Apps</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                One click connects all monorepo apps (Svivva, Pyracrypt, AI Tools Hub, Cyber
                Security, SEO Pack), fixes 404 links, and submits to Bing, Yandex, Yahoo,
                DuckDuckGo.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={runAutoConnectAll}
            disabled={autoConnectActive}
            className="font-bold"
            style={{ background: "#5BA8A0" }}
          >
            {autoConnectActive ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting all apps…
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" /> Auto-Connect All + Submit to Search Engines
              </>
            )}
          </Button>
          {autoConnectResult && (
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
              {autoConnectResult}
            </pre>
          )}
        </div>

        {/* ── Quick External Links — one-click access ── */}
        <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs font-bold text-foreground uppercase tracking-wider">
              Quick Links (open in new tab)
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              {
                label: "Google Search Console",
                href: "https://search.google.com/search-console",
                color: "#4285f4",
              },
              {
                label: "Bing Webmaster Tools",
                href: "https://www.bing.com/webmasters",
                color: "#008373",
              },
              {
                label: "Vercel Dashboard",
                href: "https://vercel.com/svivva",
                color: "#000",
              },
              {
                label: "Stripe Dashboard",
                href: "https://dashboard.stripe.com",
                color: "#635bff",
              },
              {
                label: "GitHub Repo",
                href: "https://github.com/pipertzion2-dev/all-de-apps-in-one",
                color: "#24292f",
              },
              {
                label: "svivva.com Sitemap",
                href: "https://svivva.com/sitemap.xml",
                color: TEAL,
              },
              {
                label: "svivva.com/orbit",
                href: "https://svivva.com/orbit",
                color: BURG,
              },
              {
                label: "IndexNow Status",
                href: "https://www.indexnow.org",
                color: "#ff6b35",
              },
              {
                label: "Google PageSpeed",
                href: "https://pagespeed.web.dev/analysis?url=https://svivva.com",
                color: "#34a853",
              },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/50 transition-colors text-foreground min-h-[40px]"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: link.color }}
                />
                <span className="text-[11px] font-medium leading-tight">{link.label}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-40 ml-auto flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>

        {/* Connections Hub */}
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <ConnectionsHub />
        </div>

        {/* Stripe Setup - Always visible for admin */}
        <OrbitStripeSetup />

        {/* ── Marketing Status (DB-verified) ── */}
        {orbitStatus &&
          (() => {
            const checks = [
              {
                label: "SEO Pages",
                ok: orbitStatus.seoPages >= 20,
                detail: `${orbitStatus.seoPages} pages`,
              },
              {
                label: "Competitor Pages",
                ok: orbitStatus.comparisons >= 8,
                detail: `${orbitStatus.comparisons}/8`,
              },
              {
                label: "Blog Posts",
                ok: orbitStatus.blogPosts >= 10,
                detail: `${orbitStatus.blogPosts} posts`,
              },
              {
                label: "AEO Pages",
                ok: orbitStatus.aeoPages >= 10,
                detail: `${orbitStatus.aeoPages}/10`,
              },
              {
                label: "Tools SEO Pages",
                ok: orbitStatus.seedMarketing >= (orbitStatus.targetToolSeoPages ?? 300),
                detail: `${(orbitStatus.seedMarketing ?? 0).toLocaleString()}/${orbitStatus.targetToolSeoPages ?? 300} pages`,
              },
              {
                label: "Integration Pages",
                ok: (orbitStatus.integrationPages ?? 0) >= 20,
                detail: `${orbitStatus.integrationPages ?? 0}/30`,
              },
              {
                label: "Industry Use Cases",
                ok: (orbitStatus.usecasePages ?? 0) >= 15,
                detail: `${orbitStatus.usecasePages ?? 0}/20`,
              },
              {
                label: "API Templates",
                ok: (orbitStatus.templatePages ?? 0) >= 20,
                detail: `${orbitStatus.templatePages ?? 0}/25`,
              },
              {
                label: "PAA Pages",
                ok: (orbitStatus.paaPages ?? 0) >= 10,
                detail: `${orbitStatus.paaPages ?? 0}/15`,
              },
              {
                label: "Hub Page",
                ok: orbitStatus.hubExists,
                detail: orbitStatus.hubExists ? "exists" : "missing",
              },
              {
                label: "IndexNow Key",
                ok: orbitStatus.indexNowKey,
                detail: orbitStatus.indexNowKey ? "set up" : "missing",
              },
              {
                label: "IndexNow Submitted",
                ok: orbitStatus.indexNowSubmitted,
                detail: orbitStatus.indexNowSubmitted ? "submitted" : "NOT submitted",
              },
            ];
            const doneCount = checks.filter((c) => c.ok).length;
            const allDone = doneCount === checks.length;

            return (
              <div
                className="rounded-2xl border-2 p-4 space-y-3"
                style={{
                  borderColor: allDone
                    ? "#4ade8040"
                    : !orbitStatus.indexNowSubmitted
                      ? "#ef444440"
                      : `${TEAL}40`,
                  background: allDone
                    ? "rgba(74,222,128,0.04)"
                    : !orbitStatus.indexNowSubmitted
                      ? "rgba(239,68,68,0.04)"
                      : `rgba(91,168,160,0.04)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-foreground uppercase tracking-wide flex items-center gap-2">
                      <CheckCircle2
                        className="w-3.5 h-3.5"
                        style={{ color: allDone ? "#4ade80" : TEAL }}
                      />
                      Marketing Status — Verified from DB
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {doneCount}/{checks.length} checks passing
                    </p>
                  </div>
                  {!allDone && !completing && (
                    <button
                      onClick={handleAutoComplete}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black text-white"
                      style={{ background: !orbitStatus.indexNowSubmitted ? "#ef4444" : TEAL }}
                    >
                      <Zap className="w-3 h-3" />
                      Complete Now
                    </button>
                  )}
                  {completing && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-muted-foreground bg-muted">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Running…
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {checks.map((c) => (
                    <div
                      key={c.label}
                      className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 ${c.ok ? "bg-green-500/8" : "bg-red-500/8"}`}
                    >
                      {c.ok ? (
                        <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                      ) : (
                        <Circle className="w-3 h-3 text-red-400 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-foreground truncate">
                          {c.label}
                        </p>
                        <p
                          className={`text-[9px] truncate ${c.ok ? "text-green-400" : "text-red-400"}`}
                        >
                          {c.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {!orbitStatus.indexNowSubmitted && !completeResult && (
                  <div className="rounded-xl border border-red-400/20 bg-red-500/5 px-3 py-2 text-[11px]">
                    <span className="font-bold text-red-400">⚠ IndexNow not submitted</span>
                    <span className="text-muted-foreground">
                      {" "}
                      — {(orbitStatus.seedMarketing ?? 0).toLocaleString()} pages are live but
                      search engines haven't been notified. Click <strong>Complete Now</strong> to
                      fix this.
                    </span>
                  </div>
                )}

                {completeResult && (
                  <div className="rounded-xl border border-green-400/20 bg-green-500/5 px-3 py-2 text-[10px] text-muted-foreground whitespace-pre-line max-h-40 overflow-y-auto font-mono">
                    {completeResult}
                  </div>
                )}

                {allDone && !completeResult && (
                  <div className="flex items-center gap-2 rounded-xl border border-green-400/20 bg-green-500/5 px-3 py-2 text-[11px] text-green-400">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    All marketing checks passing. Bing/Yandex/Yahoo have been notified of all pages.
                  </div>
                )}
              </div>
            );
          })()}

        {/* How this works — mini tab explainer */}
        <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-3">
          <p className="text-xs font-bold text-foreground uppercase tracking-wide">
            How Your 50 Apps Drive Traffic to Svivva
          </p>
          <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 mt-0.5"
                style={{ background: TEAL }}
              >
                1
              </div>
              <div>
                <strong className="text-foreground">Connect your deployed tools app</strong> — Orbit
                scans your mini apps and learns their names, descriptions and URLs.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 mt-0.5"
                style={{ background: BURG }}
              >
                2
              </div>
              <div>
                <strong className="text-foreground">Orbit builds SEO pages ON svivva.com</strong> —
                one page per tool, all ranking on Google, all linking to your real tools.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 mt-0.5"
                style={{ background: "#4ade80" }}
              >
                3
              </div>
              <div>
                <strong className="text-foreground">
                  Orbit generates a "Powered by Svivva" widget
                </strong>{" "}
                — paste it into each mini app so tool users click through to svivva.com.
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground px-1 font-medium uppercase tracking-wide">
            What to do:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <button
              onClick={() => setTab("growth")}
              className={`flex flex-col items-start gap-1 px-3 py-3 rounded-2xl border-2 text-left transition-all ${tab === "growth" ? "border-violet-500 bg-violet-500/10" : "border-border bg-card hover:bg-muted/30"}`}
              data-testid="tab-growth-intel"
            >
              <div className="flex items-center gap-1.5 w-full">
                <TrendingUp
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: tab === "growth" ? "#7c3aed" : undefined }}
                />
                <span
                  className="text-xs font-bold truncate"
                  style={{ color: tab === "growth" ? "#7c3aed" : undefined }}
                >
                  Growth Intel
                </span>
                <span
                  className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${tab === "growth" ? "bg-violet-500/20 text-violet-600" : "bg-green-500/15 text-green-700"}`}
                >
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">Demand scanner</p>
            </button>
            <button
              onClick={() => setTab("causal")}
              className={`flex flex-col items-start gap-1 px-3 py-3 rounded-2xl border-2 text-left transition-all ${tab === "causal" ? "border-orange-500 bg-orange-500/10" : "border-border bg-card hover:bg-muted/30"}`}
              data-testid="tab-causal-attribution"
            >
              <div className="flex items-center gap-1.5 w-full">
                <Target
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: tab === "causal" ? "#f97316" : undefined }}
                />
                <span
                  className="text-xs font-bold truncate"
                  style={{ color: tab === "causal" ? "#f97316" : undefined }}
                >
                  Causal ROI
                </span>
                <span
                  className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${tab === "causal" ? "bg-orange-500/20 text-orange-600" : "bg-orange-500/10 text-orange-700"}`}
                >
                  AI
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">True channel ROI</p>
            </button>
            <button
              onClick={() => setTab("autopilot")}
              className={`flex flex-col items-start gap-1 px-3 py-3 rounded-2xl border-2 text-left transition-all ${tab === "autopilot" ? "border-pink-500 bg-pink-500/10" : "border-border bg-card hover:bg-muted/30"}`}
              data-testid="tab-autopilot"
            >
              <div className="flex items-center gap-1.5 w-full">
                <Wand2
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: tab === "autopilot" ? "#db2777" : undefined }}
                />
                <span
                  className="text-xs font-bold truncate"
                  style={{ color: tab === "autopilot" ? "#db2777" : undefined }}
                >
                  Autopilot
                </span>
                <span
                  className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${tab === "autopilot" ? "bg-pink-500/20 text-pink-600" : "bg-pink-500/10 text-pink-700"}`}
                >
                  NEW
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Credentials + AI run all
              </p>
            </button>
            <button
              onClick={() => setTab("checklist")}
              className={`flex flex-col items-start gap-1 px-3 py-3 rounded-2xl border-2 text-left transition-all ${tab === "checklist" ? "border-amber-500 bg-amber-500/10" : "border-border bg-card hover:bg-muted/30"}`}
              data-testid="tab-checklist"
            >
              <div className="flex items-center gap-1.5 w-full">
                <ListChecks
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: tab === "checklist" ? "#f59e0b" : undefined }}
                />
                <span
                  className="text-xs font-bold truncate"
                  style={{ color: tab === "checklist" ? "#f59e0b" : undefined }}
                >
                  Checklist
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">All tasks status</p>
            </button>
            <button
              onClick={() => setTab("index22")}
              className={`flex flex-col items-start gap-1 px-3 py-3 rounded-2xl border-2 text-left transition-all ${tab === "index22" ? "border-sky-500 bg-sky-500/10" : "border-border bg-card hover:bg-muted/30"}`}
              data-testid="tab-index22"
            >
              <div className="flex items-center gap-1.5 w-full">
                <Radar
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: tab === "index22" ? "#0ea5e9" : undefined }}
                />
                <span
                  className="text-xs font-bold truncate"
                  style={{ color: tab === "index22" ? "#0ea5e9" : undefined }}
                >
                  Index 22
                </span>
                <span
                  className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${tab === "index22" ? "bg-sky-500/20 text-sky-600" : "bg-muted text-muted-foreground"}`}
                >
                  {index22Done}/{INDEX22_STEPS.length}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">
                9-phase search infra
              </p>
            </button>
            <button
              onClick={() => setTab("svivva")}
              className={`flex flex-col items-start gap-1 px-3 py-3 rounded-2xl border-2 text-left transition-all ${tab === "svivva" ? "border-[#6B2C4A] bg-[#6B2C4A]/10" : "border-border bg-card hover:bg-muted/30"}`}
            >
              <div className="flex items-center gap-1.5 w-full">
                <Globe
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: tab === "svivva" ? BURG : undefined }}
                />
                <span
                  className="text-xs font-bold truncate"
                  style={{ color: tab === "svivva" ? BURG : undefined }}
                >
                  svivva.com
                </span>
                <span
                  className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${tab === "svivva" ? "bg-[#6B2C4A]/20 text-[#6B2C4A]" : "bg-muted text-muted-foreground"}`}
                >
                  {svivvaDone}/{SVIVVA_STEPS.length}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">
                SEO, social &amp; blog
              </p>
            </button>
            <button
              onClick={() => setTab("mini")}
              className={`flex flex-col items-start gap-1 px-3 py-3 rounded-2xl border-2 text-left transition-all ${tab === "mini" ? "border-[#5BA8A0] bg-[#5BA8A0]/10" : "border-border bg-card hover:bg-muted/30"}`}
            >
              <div className="flex items-center gap-1.5 w-full">
                <Package
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: tab === "mini" ? TEAL : undefined }}
                />
                <span
                  className="text-xs font-bold truncate"
                  style={{ color: tab === "mini" ? TEAL : undefined }}
                >
                  Your tools
                </span>
                <span
                  className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${tab === "mini" ? "bg-[#5BA8A0]/20 text-[#5BA8A0]" : "bg-muted text-muted-foreground"}`}
                >
                  {miniDone}/{miniSteps.length}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Connect apps → SEO pages
              </p>
            </button>
            <button
              onClick={() => setTab("deploy")}
              className={`flex flex-col items-start gap-1 px-3 py-3 rounded-2xl border-2 text-left transition-all ${tab === "deploy" ? "border-green-500 bg-green-500/10" : "border-border bg-card hover:bg-muted/30"}`}
            >
              <div className="flex items-center gap-1.5 w-full">
                <Rocket
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: tab === "deploy" ? "#16a34a" : undefined }}
                />
                <span
                  className="text-xs font-bold truncate"
                  style={{ color: tab === "deploy" ? "#16a34a" : undefined }}
                >
                  Deploy
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">
                DNS + subdomains guide
              </p>
            </button>
          </div>
        </div>

        {/* Growth Intelligence tab */}
        {tab === "growth" && (
          <OrbitGrowthIntelligence
            onReportReady={(summary) => {
              if (statuses["svivva-growth-intelligence"] !== "done") {
                setStep("svivva-growth-intelligence", "done", summary);
              }
            }}
          />
        )}

        {tab === "causal" && <OrbitCausalAttribution />}

        {/* Marketing Autopilot tab */}
        {tab === "autopilot" && <OrbitMarketingAutopilot />}

        {/* Checklist tab — visual mission control + detailed list */}
        {tab === "checklist" && (
          <div className="flex flex-col gap-8">
            <OrbitMarketingVision
              orbitStatus={orbitStatus as Record<string, unknown> | undefined}
              stepStatuses={statuses}
            />
            <div className="border-t border-white/8 pt-6">
              <p className="text-xs text-white/25 uppercase tracking-widest mb-4">
                Detailed checklist
              </p>
              <MarketingChecklist orbitStatus={orbitStatus ?? null} stepStatuses={statuses} />
            </div>
          </div>
        )}

        {tab === "index22" && (
          <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 px-4 py-3 text-xs text-muted-foreground space-y-2">
            <div className="flex items-start gap-2">
              <Radar className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-sky-500" />
              <span>
                <strong className="text-foreground">Index 22</strong> — production search
                infrastructure (audit, sitemaps, internal links, quality gate, performance,
                conversion, analytics, monitoring). No doorway pages; thin content is rejected.
              </span>
            </div>
            <Link
              href="/dashboard/seo-health"
              className="inline-flex items-center gap-1 text-sky-600 font-semibold hover:underline"
            >
              Open SEO Health dashboard <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Tab info banner */}
        {tab === "svivva" && (
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground flex items-start gap-2">
            <Globe className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: TEAL }} />
            <span>
              These steps build the full SEO &amp; social presence for <strong>svivva.com</strong> —
              landing pages, comparisons, blog content, social packs, and sitemap submission.
            </span>
          </div>
        )}

        {tab === "mini" && (
          <>
            <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-teal-500" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="font-bold text-sm">Connect Your Apps</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Paste your deployed app URL below to discover tools and generate SEO pages.
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the URL of your deployed app (e.g., your mini apps or Pyracrypt instance).
              </p>
            </div>
          </>
        )}

        {/* Deploy tab — full guide */}
        {tab === "deploy" && (
          <DeployGuide publicHost={orbitUrls.host} publicSite={orbitUrls.site} />
        )}

        {/* ── LAUNCH EVERYTHING ─────────────────────────────────────────────── */}
        {tab !== "deploy" && tab !== "checklist" && tab !== "index22" && tab !== "growth" && (
          <LaunchStation
            launchActive={launchActive}
            launchDone={launchDone}
            launchProgress={launchProgress}
            launchCopied={launchCopied}
            setLaunchCopied={setLaunchCopied}
            setLaunchDone={setLaunchDone}
            onLaunch={launchEverything}
            coreUrls={orbitStatus?.coreUrls ?? []}
            toolUrls={orbitStatus?.toolUrls ?? []}
            totalSteps={SVIVVA_STEPS.length + miniSteps.length}
            sitemapUrl={orbitUrls.sitemap}
          />
        )}

        {/* Progress + Run All — only for svivva/mini/index22 tabs */}
        {tab !== "deploy" && tab !== "checklist" && tab !== "growth" && steps.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {tabDone} of {steps.length} steps complete
                </span>
                <span className="font-bold" style={{ color: TEAL }}>
                  {Math.round((tabDone / steps.length) * 100)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((tabDone / steps.length) * 100)}%`,
                    background: allTabDone ? "#16a34a" : TEAL,
                  }}
                />
              </div>
            </div>

            {!allTabDone &&
              (runAllActive ? (
                <button
                  onClick={stopRunAll}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white min-h-[40px]"
                  style={{ background: "#dc2626" }}
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Stop
                </button>
              ) : (
                <button
                  onClick={runAll}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white min-h-[40px] active:scale-95 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${BURG}, ${TEAL})` }}
                  data-testid="btn-run-all"
                >
                  <ListChecks className="w-3.5 h-3.5" />
                  Run All <span className="opacity-70 text-xs">({pendingCount})</span>
                </button>
              ))}
          </div>
        )}

        {/* Mini Source Config (above step 1) */}
        {tab === "mini" && (
          <MiniSourceConfig
            sourceUrl={sourceUrl}
            setSourceUrl={setSourceUrl}
            discoveredTools={discoveredTools}
            setDiscoveredTools={setDiscoveredTools}
            savedUrl={creds?.miniAppsUrl}
          />
        )}

        {/* Step cards — svivva / mini / index22 */}
        {(tab === "svivva" || tab === "mini" || tab === "index22") &&
          steps.map((step, idx) => (
            <StepCard
              key={step.id}
              step={step}
              idx={idx}
              status={statuses[step.id] || "pending"}
              result={results[step.id] || ""}
              onExecute={() => executeStep(step.id)}
              onReset={() => resetStep(step.id)}
              isQueued={queuedSteps.has(step.id)}
              toolCount={step.needsTools ? discoveredTools.length : undefined}
            />
          ))}

        {/* Completion */}
        {tab !== "deploy" && tab !== "checklist" && tab !== "growth" && allTabDone && (
          <div
            className="rounded-2xl p-6 text-center space-y-2"
            style={{
              background: `linear-gradient(135deg, ${TEAL}15, ${BURG}15)`,
              border: `2px solid ${TEAL}30`,
            }}
          >
            <p className="text-3xl">🚀</p>
            <p className="font-black text-lg">
              {tab === "svivva"
                ? "svivva.com is in orbit!"
                : tab === "mini"
                  ? "Your tools are live on Google!"
                  : tab === "index22"
                    ? "Index 22 infrastructure complete!"
                    : "Deployment configured"}
            </p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {tab === "svivva"
                ? "Switch to the Your Tools tab to promote your deployed mini apps."
                : tab === "mini"
                  ? "Your app URLs are connected — Google traffic can flow to your live tools."
                  : tab === "index22"
                    ? "Run marketing steps on svivva.com and Your tools tabs, or use Run Everything above."
                    : "Deployment is ready — your marketing will go live on deploy."}
            </p>
            {tab === "svivva" && (
              <button
                onClick={() => setTab("mini")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white mt-1"
                style={{ background: TEAL }}
              >
                Connect your tools app <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Google Indexing Panel — always visible once orbit has run */}
        {tab !== "deploy" && tab !== "checklist" && (
          <GoogleIndexPanel
            coreUrls={orbitStatus?.coreUrls ?? []}
            toolUrls={orbitStatus?.toolUrls ?? []}
            sitemapUrl={orbitUrls.sitemap}
          />
        )}

        {/* Quick links */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Quick Links
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Marketing Hub", href: "/marketing-hub" },
              { label: "Marketing AI", href: "/dashboard/marketing" },
              { label: "Cyber Security", href: "/cyber-security-mini-apps" },
              { label: "AI Tools Hub", href: "/ai-tools-hub" },
              { label: "Cyber Security", href: "/cyber-security-mini-apps" },
              { label: "SEO Pack", href: "/seo-pack" },
              { label: "Seeds Funnel", href: "/seeds#seeds-marketing" },
              { label: "Referrals", href: "/referrals" },
              { label: "Orbit (Public)", href: "/orbit" },
              { label: "Keywords", href: "/dashboard/keywords" },
              { label: "Blog Content", href: "/dashboard/content" },
              { label: "View Sitemap", href: "/sitemap.xml", external: true },
              {
                label: "Search Console",
                href: "https://search.google.com/search-console",
                external: true,
              },
            ].map(({ label, href, external }) => (
              <a
                key={label}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-border bg-muted/20 hover:bg-muted/50 transition-colors text-foreground font-medium min-h-[40px]"
              >
                {label}
                {external && <ExternalLink className="w-2.5 h-2.5 opacity-40 ml-auto" />}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
