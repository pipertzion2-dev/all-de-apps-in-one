"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
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
} from "lucide-react";
import { ConnectionsHub } from "@/components/connections-hub";
import { OrbitStripeSetup } from "@/components/orbit-stripe-setup";
import { ReplitUsernameConnector } from "@/components/replit-username-connector";
import { MarketingChecklist } from "@/components/marketing-checklist";
import { usePublicOrbitUrls } from "@/hooks/use-public-orbit-urls";
import { getPyracryptOrbitPreset } from "@/lib/workspace-external-apps";

const TEAL = "#5BA8A0";
const BURG = "#6B2C4A";
const CHUNK_SIZE = 30;

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
  icon: React.ElementType;
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
      title: "40 Directory Submissions",
      icon: ListChecks,
      estimate: "~30s",
      description:
        "Listing content for Futurepedia, TAAFT, Product Hunt, G2, AlternativeTo, SaaSHub, RapidAPI + 33 more",
      auto: [
        "40 directory listing texts generated (name, tagline, description, categories, screenshots list)",
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
      title: "Submit Everywhere",
      icon: Activity,
      estimate: "~10s",
      description: "Ping Bing sitemap · Re-submit all URLs via IndexNow · Verify sitemap coverage",
      auto: [
        "All URLs re-submitted to Bing, Yandex, Yahoo via IndexNow",
        "Bing sitemap pinged directly",
      ],
      manual: [
        `Google Search Console → Sitemaps → paste ${sitemap} → Submit (one-time setup)`,
        "Google Search Console → URL Inspection → paste each key URL → Request Indexing (do this for: homepage, /pyracrypt, /blog, /tools, and each LP)",
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
  ];
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
        `Creates 4 SEO pages per tool at ${host}/{slug}`,
        "Pages published and submitted to Bing/Yandex/Yahoo via IndexNow",
      ],
      manual: [
        "Request indexing in Google Search Console for each tool page",
        "After GSC indexing is requested, Google typically indexes within 1–7 days",
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
        "Auto-creates apps.svivva.com, security.svivva.com, pyracrypt.svivva.com via GoDaddy API",
      auto: ["GoDaddy DNS CNAME records added for all 3 subdomains (if GoDaddy API key is set)"],
      manual: [
        "Wait 24–48 hours for DNS propagation before the subdomains resolve",
        "Test after 24h: open apps.svivva.com in a browser — if it loads your hosted app you're done",
        "If GoDaddy API failed: go to GoDaddy DNS Manager → add CNAME records manually (details in Results below)",
      ],
    },
    {
      id: "mini-index",
      title: "Index Everything",
      icon: Zap,
      estimate: "~5s",
      description: "Submit all SEO pages, hub and category pages to Bing/Yandex/Yahoo via IndexNow",
      auto: [
        "All tool pages, hub page, and category pages submitted to Bing/Yandex/Yahoo/DuckDuckGo via IndexNow",
      ],
      manual: [
        `Google Search Console → URL Inspection → paste ${site}/tools → Request Indexing`,
        "Then request indexing for 5–10 of your most important tool pages",
        "Google does NOT accept IndexNow submissions — GSC is required for Google",
      ],
    },
  ];
}

const PYRACRYPT_PRESET = getPyracryptOrbitPreset();

const STORAGE_KEY = "orbit_v3";

function loadState(): { statuses: Record<string, StepStatus>; results: Record<string, string> } {
  if (typeof window === "undefined") return { statuses: {}, results: {} };
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || { statuses: {}, results: {} };
  } catch {
    return { statuses: {}, results: {} };
  }
}
function saveState(s: Record<string, StepStatus>, r: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ statuses: s, results: r }));
  } catch {
    /**/
  }
}

interface ReplItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  url: string;
  imageUrl?: string;
}

// ── Multi-Repl connector ───────────────────────────────────────────────────
interface ReplEntry {
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
  replitUsername,
  savedUrl,
}: {
  sourceUrl: string;
  setSourceUrl: (u: string) => void;
  discoveredTools: DiscoveredTool[];
  setDiscoveredTools: (t: DiscoveredTool[]) => void;
  replitUsername?: string | null;
  savedUrl?: string | null;
}) {
  const isConnected = discoveredTools.length > 0;

  const [entries, setEntries] = useState<ReplEntry[]>([
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
  const persistEntries = (updated: ReplEntry[]) => {
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
    const updated = [...entries, { id: crypto.randomUUID(), name: "", url: "" }];
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

  // Scan each Repl URL via discover-tools API, then merge all tools
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

    // Persist ALL entered URLs (comma-separated) so every field pre-fills on next visit
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
    // Group tools by source Repl hostname
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

    // Return to entry form keeping all existing Repl URLs pre-filled + one blank row to add more
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
      const prefilled = existingOrigins.map((origin) => ({
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

        {/* Per-Repl summary rows */}
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

        {/* Add more Repls */}
        <div className="px-4 pb-3 pt-1.5">
          <button
            onClick={goToAddMore}
            data-testid="btn-add-more-repls"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed font-bold text-xs transition-all hover:bg-muted/20"
            style={{ borderColor: `${TEAL}50`, color: TEAL }}
          >
            <span className="text-base leading-none">+</span> Add more Repls
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
          <p className="text-sm font-bold text-foreground">Connect your Repls</p>
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
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      Repl {idx + 1}
                    </p>
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
                  data-testid={`input-repl-name-${idx}`}
                />
                <input
                  type="url"
                  value={entry.url}
                  onChange={(e) => updateEntry(entry.id, "url", e.target.value)}
                  placeholder="https://your-app.svivva.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#5BA8A0]/40 disabled:opacity-50"
                  disabled={scanning}
                  data-testid={`input-repl-url-${idx}`}
                />
              </div>
            );
          })}
        </div>

        <button
          onClick={addEntry}
          disabled={scanning}
          className="w-full py-2 rounded-xl border border-dashed border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-[#5BA8A0]/60 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
          data-testid="button-add-repl"
        >
          <span className="text-base leading-none">+</span> Add another App
        </button>

        {replitUsername && (
          <p className="text-[11px] text-muted-foreground text-center">
            Connected as <span className="font-semibold text-foreground">@{replitUsername}</span>
          </p>
        )}

        <button
          onClick={scanAndConnect}
          disabled={validCount === 0 || scanning}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
          style={{
            background:
              validCount > 0 && !scanning ? `linear-gradient(135deg, ${BURG}, ${TEAL})` : undefined,
          }}
          data-testid="button-scan-connect-repls"
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
      className="rounded-2xl overflow-hidden border-2"
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
  { sub: "apps", target: "apps.svivva.com", label: "Pyracrypt mini-apps", color: "#6B2C4A" },
  { sub: "security", target: "security.svivva.com", label: "Pyracrypt main app", color: "#5BA8A0" },
  { sub: "pyracrypt", target: "pyracrypt.svivva.com", label: "Pyracrypt alias", color: "#5BA8A0" },
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

// ── Main page ──────────────────────────────────────────────────────────────
export default function LaunchpadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const orbitUrls = usePublicOrbitUrls();
  const SVIVVA_STEPS = useMemo(() => makeSvivvaSteps(orbitUrls), [orbitUrls]);
  const miniSteps = useMemo(() => makeMiniSteps(orbitUrls), [orbitUrls]);
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
  const [tab, setTab] = useState<"svivva" | "mini" | "deploy" | "checklist">("svivva");
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

  // Mini apps source state
  const [sourceUrl, setSourceUrl] = useState("");
  const [discoveredTools, setDiscoveredTools] = useState<DiscoveredTool[]>([]);

  const runAllRef = useRef(false);
  const statusesRef = useRef<Record<string, StepStatus>>({});

  const { data: me, isLoading: meLoading } = useQuery<{
    isAdmin: boolean;
    vercelCommit?: string | null;
    nextPublicSiteUrl?: string | null;
  }>({
    queryKey: ["/api/auth/me"],
    queryFn: () => authFetch("/api/auth/me").then((r) => r.json()),
  });
  useEffect(() => {
    if (!meLoading && me && !me.isAdmin) router.replace("/dashboard");
  }, [me, meLoading, router]);

  const { data: creds } = useQuery<{
    hasReplit: boolean;
    replitUsername?: string | null;
    godaddyDomain: string | null;
    miniAppsUrl?: string | null;
  }>({
    queryKey: ["/api/seeds/credentials"],
    queryFn: () => authFetch("/api/seeds/credentials").then((r) => r.json()),
    enabled: !!me?.isAdmin,
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
    coreUrls: GscUrlItem[];
    toolUrls: GscUrlItem[];
  }
  const { data: orbitStatus, refetch: refetchStatus } = useQuery<OrbitStatus>({
    queryKey: ["/api/orbit/status"],
    queryFn: () => authFetch("/api/orbit/status").then((r) => r.json()),
    enabled: !!me?.isAdmin,
    staleTime: 30_000,
  });

  const handleAutoComplete = async () => {
    setCompleting(true);
    setCompleteResult(null);
    try {
      const res = await authFetch("/api/orbit/auto-complete", { method: "POST" });
      const data = await res.json();
      setCompleteResult(data.summary || data.error || "Done");
      refetchStatus();
      toast({
        title: "Marketing completed!",
        description: `${data.details?.totalUrls ?? 0} URLs submitted to IndexNow.`,
      });
    } catch (e) {
      setCompleteResult(`Error: ${String(e)}`);
    } finally {
      setCompleting(false);
    }
  };

  // Load persisted state
  useEffect(() => {
    const saved = loadState();
    const s = saved.statuses || {};
    statusesRef.current = s;
    setStatuses(s);
    setResults(saved.results || {});
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
      if (statusesRef.current[stepId] === "done") return true;
      setStep(stepId, "running");

      const effectiveSourceUrl = overrideSourceUrl ?? sourceUrlRef.current;
      const effectiveTools = discoveredRef.current;

      try {
        // mini-import: chunk tools to avoid browser/proxy timeouts
        if (stepId === "mini-import" && effectiveTools.length > 0) {
          const totalChunks = Math.ceil(effectiveTools.length / CHUNK_SIZE);
          const summaries: string[] = [];
          let totalPages = 0;

          for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const chunkNum = chunkIndex + 1;
            const processed = Math.min((chunkIndex + 1) * CHUNK_SIZE, effectiveTools.length);
            setStep(
              stepId,
              "running",
              `Building pages… ${processed} / ${effectiveTools.length} tools (batch ${chunkNum}/${totalChunks})`,
            );

            const body = {
              stepId,
              sourceUrl: effectiveSourceUrl,
              tools: effectiveTools,
              chunkIndex,
              chunkSize: CHUNK_SIZE,
            };

            const res = await authFetch("/api/orbit/run-step", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
            if (data.summary) summaries.push(data.summary);
            totalPages += data.details?.totalPages ?? 0;
          }

          const finalSummary = [
            `✓ All ${effectiveTools.length} tools processed across ${totalChunks} batch${totalChunks === 1 ? "" : "es"}`,
            `✓ ${totalPages} SEO pages live on ${orbitUrls.host}`,
            "",
            ...summaries.slice(-1),
          ]
            .filter(Boolean)
            .join("\n");

          setStep(stepId, "done", finalSummary);
          return true;
        }

        const body: Record<string, unknown> = { stepId };

        // Pass sourceUrl + tools for all mini-* steps that need context about the other Repl
        if (stepId.startsWith("mini-")) {
          body.sourceUrl = effectiveSourceUrl;
          if (effectiveTools.length) body.tools = effectiveTools;
        }

        // 8-minute client-side abort — prevents infinite hang if server stalls
        const controller = new AbortController();
        const abortTimer = setTimeout(() => controller.abort(), 8 * 60 * 1000);

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
          isAbort ? "Timed out after 8 minutes — click to retry" : String(e).replace("Error: ", ""),
        );
        return false;
      }
    },
    [setStep, orbitUrls.host],
  );

  const runAll = async () => {
    const steps = tab === "svivva" ? SVIVVA_STEPS : miniSteps;
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

  const launchEverything = async () => {
    if (launchActive) return;
    setLaunchActive(true);
    setLaunchDone(false);

    // Always ensure mini steps have a sourceUrl — fall back to the Pyracrypt preset
    const miniSrc = sourceUrlRef.current.trim() || PYRACRYPT_PRESET.miniAppsUrl;
    if (!sourceUrlRef.current.trim()) {
      setSourceUrl(miniSrc);
      sourceUrlRef.current = miniSrc;
    }

    const allSteps = [...SVIVVA_STEPS, ...miniSteps];
    const total = allSteps.length;
    let idx = 0;

    for (const step of allSteps) {
      idx++;
      if (statusesRef.current[step.id] === "done") continue;
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
    refetchStatus();
    toast({
      title: "🚀 Orbit complete!",
      description: "Copy your URLs below and paste them into Google Search Console.",
      duration: 8000,
    });
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

  if (meLoading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  if (!me?.isAdmin) return null;

  const steps = tab === "svivva" ? SVIVVA_STEPS : tab === "mini" ? miniSteps : [];
  const svivvaDone = SVIVVA_STEPS.filter((s) => statuses[s.id] === "done").length;
  const miniDone = miniSteps.filter((s) => statuses[s.id] === "done").length;
  const totalDone = svivvaDone + miniDone;
  const totalSteps = SVIVVA_STEPS.length + miniSteps.length;
  const tabDone = tab === "svivva" ? svivvaDone : tab === "mini" ? miniDone : 0;
  const allTabDone = steps.length > 0 && tabDone === steps.length;
  const pendingCount = steps.filter((s) => (statuses[s.id] || "pending") !== "done").length;
  const overallPct = Math.round((totalDone / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-background">
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
                    {me?.vercelCommit ? (
                      <p className="font-mono text-white/55">
                        Running build{" "}
                        <span className="text-white/80">{me.vercelCommit.slice(0, 7)}</span>
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
                        No Vercel commit id on this server — if Orbit still feels old, open Vercel →
                        Deployments → Redeploy, and confirm this GitHub repo is linked to that
                        project.
                      </p>
                    )}
                    <p className="text-white/55">
                      Sign-in still redirects through{" "}
                      <span className="text-white/75">Replit OpenID</span> — that is expected until
                      a different auth provider is configured.
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
              <p className="text-[11px] text-white/40">steps done</p>
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
        {/* Connections Hub */}
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <ConnectionsHub />
        </div>

        {tab === "svivva" && <OrbitStripeSetup isAdmin={!!me?.isAdmin} />}

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
                ok: orbitStatus.seedMarketing >= 100,
                detail: `${orbitStatus.seedMarketing.toLocaleString()} pages`,
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
                      — {orbitStatus.seedMarketing.toLocaleString()} pages are live but search
                      engines haven't been notified. Click <strong>Complete Now</strong> to fix
                      this.
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
          <div className="grid grid-cols-4 gap-2">
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

        {/* Checklist tab */}
        {tab === "checklist" && (
          <MarketingChecklist orbitStatus={orbitStatus ?? null} stepStatuses={statuses} />
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
            <ReplitUsernameConnector
              connected={!!creds?.hasReplit}
              username={creds?.replitUsername}
            />
            {creds?.hasReplit && (
              <p className="text-xs text-muted-foreground px-1">
                Optional: Replit catalog below. Paste any deployed app URL to discover tools and
                generate SEO pages.
              </p>
            )}
          </>
        )}

        {/* Deploy tab — full guide */}
        {tab === "deploy" && (
          <DeployGuide publicHost={orbitUrls.host} publicSite={orbitUrls.site} />
        )}

        {/* ── LAUNCH EVERYTHING ─────────────────────────────────────────────── */}
        {tab !== "deploy" && tab !== "checklist" && (
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

        {/* Progress + Run All — only for svivva/mini tabs */}
        {tab !== "deploy" && tab !== "checklist" && (
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
            replitUsername={creds?.replitUsername}
            savedUrl={creds?.miniAppsUrl}
          />
        )}

        {/* Step cards — only for svivva/mini tabs */}
        {tab !== "deploy" &&
          tab !== "checklist" &&
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
        {tab !== "deploy" && tab !== "checklist" && allTabDone && (
          <div
            className="rounded-2xl p-6 text-center space-y-2"
            style={{
              background: `linear-gradient(135deg, ${TEAL}15, ${BURG}15)`,
              border: `2px solid ${TEAL}30`,
            }}
          >
            <p className="text-3xl">🚀</p>
            <p className="font-black text-lg">
              {tab === "svivva" ? "svivva.com is in orbit!" : "Your tools are live on Google!"}
            </p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {tab === "svivva"
                ? "Switch to the Your Tools tab to promote your deployed mini apps."
                : "Your app URLs are connected — Google traffic can flow to your live tools."}
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
              { label: "Marketing AI", href: "/dashboard/marketing" },
              { label: "Seeds Funnel", href: "/seeds#seeds-marketing" },
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
