"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  ExternalLink,
  TrendingUp,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { usePublicOrbitUrls } from "@/hooks/use-public-orbit-urls";

const TEAL = "#5BA8A0";
const BURG = "#6B2C4A";
const MANUAL_STORAGE_KEY = "orbit_manual_v1";

type TaskStatus = "done" | "warn" | "missing" | "auto";

interface Task {
  id: string;
  label: string;
  detail: string;
  status: TaskStatus;
  link?: string;
  linkLabel?: string;
  priority?: "high" | "medium" | "low";
}

interface Group {
  title: string;
  emoji: string;
  tasks: Task[];
}

interface Props {
  orbitStatus: {
    seoPages: number;
    comparisons: number;
    blogPosts: number;
    aeoPages: number;
    seedMarketing: number;
    hubExists: boolean;
    indexNowKey: boolean;
    indexNowSubmitted: boolean;
    integrationPages?: number;
    usecasePages?: number;
    templatePages?: number;
    paaPages?: number;
  } | null;
  stepStatuses: Record<string, "pending" | "running" | "done" | "error">;
}

function statusIcon(s: TaskStatus) {
  if (s === "done")
    return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />;
  if (s === "warn")
    return <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />;
  if (s === "auto") return <Zap className="w-3.5 h-3.5 text-[#5BA8A0] flex-shrink-0 mt-0.5" />;
  return <Circle className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0 mt-0.5" />;
}

function statusBg(s: TaskStatus) {
  if (s === "done") return "bg-emerald-500/5 border-emerald-500/15";
  if (s === "warn") return "bg-amber-500/5 border-amber-500/20";
  if (s === "auto") return "bg-[#5BA8A0]/5 border-[#5BA8A0]/15";
  return "bg-muted/20 border-border/40";
}

export function MarketingChecklist({ orbitStatus, stepStatuses }: Props) {
  const orbitUrls = usePublicOrbitUrls();
  const ORBIT_SITE = orbitUrls.site;
  const ORBIT_SITEMAP = orbitUrls.sitemap;
  const ORBIT_HOST = orbitUrls.host;

  const [manualDone, setManualDone] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<string | null>("next");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(MANUAL_STORAGE_KEY) || "{}");
      setManualDone(saved);
    } catch {
      /**/
    }
  }, []);

  const toggleManual = (id: string) => {
    setManualDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(MANUAL_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /**/
      }
      return next;
    });
  };

  const { data: growthData } = useQuery({
    queryKey: ["/api/growth/directories", "svivva"],
    queryFn: async () => {
      const r = await authFetch("/api/growth/directories?product=svivva");
      return r.json();
    },
    staleTime: 60_000,
  });

  const { data: tasksData } = useQuery({
    queryKey: ["/api/growth/tasks"],
    queryFn: async () => {
      const r = await authFetch("/api/growth/tasks");
      return r.json();
    },
    staleTime: 60_000,
  });

  const dirStats = growthData?.stats ?? { total: 0, submitted: 0, live: 0 };
  const lastGrowthRun = (tasksData?.tasks ?? [])[0]?.runAt;

  const orbitStepDone = (id: string) => stepStatuses[id] === "done";

  // ── Build checklist groups ──────────────────────────────────────────────────
  const groups: Group[] = [
    {
      title: "Technical Foundation",
      emoji: "⚙️",
      tasks: [
        {
          id: "tech-indexnow-key",
          label: "IndexNow key set up",
          detail: orbitStatus?.indexNowKey
            ? "Key exists in DB — search engines will accept URL submissions"
            : `Run 'Set Up IndexNow' in the ${ORBIT_HOST} tab`,
          status: orbitStatus?.indexNowKey ? "done" : "missing",
          link: "/dashboard/launchpad",
          linkLabel: "Go to Orbit →",
          priority: "high",
        },
        {
          id: "tech-indexnow-submitted",
          label: "URLs submitted via IndexNow",
          detail: orbitStatus?.indexNowSubmitted
            ? "Bing/Yandex/Yahoo notified — automated weekly"
            : "Run IndexNow step or click 'Run Weekly Tasks' in Growth Engine",
          status: orbitStatus?.indexNowSubmitted ? "auto" : "missing",
          link: "/dashboard/growth",
          linkLabel: "Go to Growth Engine →",
          priority: "high",
        },
        {
          id: "tech-sitemap",
          label: `Sitemap accessible at ${ORBIT_SITEMAP.replace(/^https?:\/\//, "")}`,
          detail: "Automated — check GSC Connect page to verify",
          status: "auto",
          link: "/dashboard/gsc-connect",
          linkLabel: "Check GSC →",
        },
        {
          id: "tech-gsc-sitemap",
          label: "Sitemap submitted in Google Search Console",
          detail: manualDone["tech-gsc-sitemap"]
            ? "Done ✓"
            : `GSC → Sitemaps → paste ${ORBIT_SITEMAP} → Submit. Without this, Google will not crawl your site.`,
          status: manualDone["tech-gsc-sitemap"] ? "done" : "missing",
          link: "https://search.google.com/search-console",
          linkLabel: "Open GSC →",
          priority: "high",
        },
        {
          id: "tech-schema-jsonld",
          label: "Schema.org JSON-LD added to homepage",
          detail: manualDone["tech-schema-jsonld"]
            ? "Done ✓"
            : "Orbit generated this (svivva-schema step results). Copy the JSON-LD → paste into your homepage <head>. Enables rich results.",
          status: orbitStepDone("svivva-schema")
            ? manualDone["tech-schema-jsonld"]
              ? "done"
              : "warn"
            : "missing",
          priority: "medium",
        },
        {
          id: "tech-rich-results",
          label: "Rich results test passed",
          detail: manualDone["tech-rich-results"]
            ? "Done ✓"
            : `After adding JSON-LD: test at search.google.com/test/rich-results → paste ${ORBIT_HOST}`,
          status: manualDone["tech-rich-results"]
            ? "done"
            : manualDone["tech-schema-jsonld"]
              ? "warn"
              : "missing",
          link: "https://search.google.com/test/rich-results",
          linkLabel: "Test now →",
          priority: "low",
        },
      ],
    },
    {
      title: "AI-Generated Content",
      emoji: "🤖",
      tasks: [
        {
          id: "content-seo-pages",
          label: `SEO landing pages (${orbitStatus?.seoPages ?? 0}/40 created)`,
          detail:
            (orbitStatus?.seoPages ?? 0) >= 40
              ? "All 40 pages created and live — automated weekly"
              : `${orbitStatus?.seoPages ?? 0} pages exist. Run 'SEO Landing Pages' in the ${ORBIT_HOST} tab to create more.`,
          status:
            (orbitStatus?.seoPages ?? 0) >= 40
              ? "auto"
              : orbitStepDone("svivva-seo-pages")
                ? "done"
                : "missing",
          link: "/dashboard/launchpad",
          linkLabel: "Go to Orbit →",
        },
        {
          id: "content-comparisons",
          label: `Competitor comparison pages (${orbitStatus?.comparisons ?? 0}/20)`,
          detail:
            (orbitStatus?.comparisons ?? 0) >= 20
              ? "All 20 comparison pages live"
              : `Run 'Competitor Comparisons' step in Orbit`,
          status:
            (orbitStatus?.comparisons ?? 0) >= 20
              ? "done"
              : orbitStepDone("svivva-comparisons")
                ? "done"
                : "missing",
          link: "/dashboard/launchpad",
          linkLabel: "Go to Orbit →",
          priority: "high",
        },
        {
          id: "content-blog",
          label: `Blog posts (${orbitStatus?.blogPosts ?? 0}/10 published)`,
          detail:
            (orbitStatus?.blogPosts ?? 0) >= 10
              ? "10 blog posts live"
              : "Run 'SEO Blog Articles' step in Orbit",
          status:
            (orbitStatus?.blogPosts ?? 0) >= 10
              ? "done"
              : orbitStepDone("svivva-blog")
                ? "done"
                : "missing",
        },
        {
          id: "content-aeo",
          label: `AEO pages for AI search (${orbitStatus?.aeoPages ?? 0}/15)`,
          detail:
            (orbitStatus?.aeoPages ?? 0) >= 15
              ? "15 AEO pages live — Perplexity/ChatGPT will cite these"
              : "Run 'AI Search Optimization' step in Orbit",
          status:
            (orbitStatus?.aeoPages ?? 0) >= 15
              ? "done"
              : orbitStepDone("svivva-aeo")
                ? "done"
                : "missing",
          link: "/dashboard/launchpad",
          linkLabel: "Go to Orbit →",
          priority: "high",
        },
        {
          id: "content-integrations",
          label: `Integration pages — Svivva + [Tool] (${orbitStatus?.integrationPages ?? 0}/30)`,
          detail:
            (orbitStatus?.integrationPages ?? 0) >= 30
              ? "All 30 integration pages live — targeting 'tool + AI API' searches"
              : `Run '30 Integration Pages' step in Orbit (${orbitStatus?.integrationPages ?? 0}/30 created)`,
          status:
            (orbitStatus?.integrationPages ?? 0) >= 30
              ? "done"
              : orbitStepDone("svivva-integrations")
                ? "done"
                : "missing",
          link: "/dashboard/launchpad",
          linkLabel: "Go to Orbit →",
          priority: "high",
        },
        {
          id: "content-usecases",
          label: `Industry use case pages (${orbitStatus?.usecasePages ?? 0}/20)`,
          detail:
            (orbitStatus?.usecasePages ?? 0) >= 20
              ? "All 20 industry use case pages live — targeting decision-maker searches"
              : `Run '20 Industry Use Case Pages' step in Orbit (${orbitStatus?.usecasePages ?? 0}/20 created)`,
          status:
            (orbitStatus?.usecasePages ?? 0) >= 20
              ? "done"
              : orbitStepDone("svivva-usecases")
                ? "done"
                : "missing",
          link: "/dashboard/launchpad",
          linkLabel: "Go to Orbit →",
          priority: "high",
        },
        {
          id: "content-templates",
          label: `API template library (${orbitStatus?.templatePages ?? 0}/25)`,
          detail:
            (orbitStatus?.templatePages ?? 0) >= 25
              ? "All 25 template pages live — targeting 'build X API' developer searches"
              : `Run '25 API Template Pages' step in Orbit (${orbitStatus?.templatePages ?? 0}/25 created)`,
          status:
            (orbitStatus?.templatePages ?? 0) >= 25
              ? "done"
              : orbitStepDone("svivva-templates")
                ? "done"
                : "missing",
          link: "/dashboard/launchpad",
          linkLabel: "Go to Orbit →",
        },
        {
          id: "content-paa",
          label: `People Also Ask domination (${orbitStatus?.paaPages ?? 0}/15)`,
          detail:
            (orbitStatus?.paaPages ?? 0) >= 15
              ? "All 15 PAA pages live — appearing in Google PAA boxes + Perplexity citations"
              : `Run 'People Also Ask Domination' step in Orbit (${orbitStatus?.paaPages ?? 0}/15 created)`,
          status:
            (orbitStatus?.paaPages ?? 0) >= 15
              ? "done"
              : orbitStepDone("svivva-paa")
                ? "done"
                : "missing",
          link: "/dashboard/launchpad",
          linkLabel: "Go to Orbit →",
          priority: "high",
        },
        {
          id: "content-parasite",
          label: "Parasite SEO articles drafted",
          detail: orbitStepDone("svivva-parasite")
            ? "Articles generated — need to be published on platforms (see below)"
            : "Run 'Parasite SEO Articles' step in Orbit",
          status: orbitStepDone("svivva-parasite") ? "warn" : "missing",
          link: "/dashboard/launchpad",
          linkLabel: "Go to Orbit →",
          priority: "high",
        },
        {
          id: "content-social-pack",
          label: "Social launch pack drafted",
          detail: orbitStepDone("svivva-social")
            ? "Twitter thread, LinkedIn, Product Hunt copy generated"
            : "Run 'Full Social Launch Pack' step",
          status: orbitStepDone("svivva-social") ? "warn" : "missing",
          link: "/dashboard/launchpad",
          linkLabel: "Go to Orbit →",
        },
        {
          id: "content-community",
          label: "Community post drafts ready",
          detail: orbitStepDone("svivva-communities")
            ? "Reddit, Show HN, IH posts drafted — need manual posting"
            : "Run 'Community Strategy Pack' step",
          status: orbitStepDone("svivva-communities") ? "warn" : "missing",
          link: "/dashboard/launchpad",
          linkLabel: "Go to Orbit →",
        },
        {
          id: "content-outreach",
          label: "PR / newsletter / podcast pitches drafted",
          detail: orbitStepDone("svivva-outreach")
            ? "Press release + 10 newsletter pitches + 8 podcast pitches generated"
            : "Run 'PR & Newsletter Pitches' step",
          status: orbitStepDone("svivva-outreach") ? "warn" : "missing",
          link: "/dashboard/launchpad",
          linkLabel: "Go to Orbit →",
        },
      ],
    },
    {
      title: "Manual Publishing",
      emoji: "✍️",
      tasks: [
        {
          id: "manual-devto",
          label: "Dev.to parasite article published",
          detail: manualDone["manual-devto"]
            ? "Done ✓"
            : "Copy article from Orbit parasite results → dev.to/new → publish. DA 94 — ranks within days.",
          status: manualDone["manual-devto"] ? "done" : "missing",
          link: "https://dev.to/new",
          linkLabel: "dev.to →",
          priority: "high",
        },
        {
          id: "manual-medium",
          label: "Medium article published",
          detail: manualDone["manual-medium"]
            ? "Done ✓"
            : "Copy from Orbit results → medium.com/new-story → publish. DA 96.",
          status: manualDone["manual-medium"] ? "done" : "missing",
          link: "https://medium.com/new-story",
          linkLabel: "Medium →",
          priority: "high",
        },
        {
          id: "manual-hashnode",
          label: "Hashnode article published",
          detail: manualDone["manual-hashnode"]
            ? "Done ✓"
            : "Copy from Orbit results → hashnode.com → publish",
          status: manualDone["manual-hashnode"] ? "done" : "missing",
          link: "https://hashnode.com",
          linkLabel: "Hashnode →",
        },
        {
          id: "manual-reddit-sideproject",
          label: "Reddit r/SideProject post submitted",
          detail: manualDone["manual-reddit-sideproject"]
            ? "Done ✓"
            : "Copy post from Orbit community pack → post. Don't cross-post to multiple subs at once — start with r/SideProject.",
          status: manualDone["manual-reddit-sideproject"] ? "done" : "missing",
          link: "https://reddit.com/r/SideProject/submit",
          linkLabel: "r/SideProject →",
          priority: "high",
        },
        {
          id: "manual-showhn",
          label: "Show HN submitted on Hacker News",
          detail: manualDone["manual-showhn"]
            ? "Done ✓"
            : "Submit at news.ycombinator.com/submit — title must start with 'Show HN:'. Best time: 9am–12pm EST weekdays.",
          status: manualDone["manual-showhn"] ? "done" : "missing",
          link: "https://news.ycombinator.com/submit",
          linkLabel: "HN →",
          priority: "high",
        },
        {
          id: "manual-producthunt",
          label: "Product Hunt launch submitted",
          detail: manualDone["manual-producthunt"]
            ? "Done ✓"
            : "Biggest single-day traffic spike possible. Copy copy from Orbit social pack → submit at 12:01am PST for full day of votes.",
          status: manualDone["manual-producthunt"] ? "done" : "missing",
          link: "https://www.producthunt.com/posts/new",
          linkLabel: "Product Hunt →",
          priority: "high",
        },
        {
          id: "manual-twitter-thread",
          label: "Twitter/X launch thread posted",
          detail: manualDone["manual-twitter-thread"]
            ? "Done ✓"
            : "Post the thread from Orbit social pack. Hook tweet first, then reply with each numbered tweet.",
          status: manualDone["manual-twitter-thread"] ? "done" : "missing",
          link: "https://twitter.com/compose/tweet",
          linkLabel: "Twitter →",
        },
        {
          id: "manual-linkedin",
          label: "LinkedIn post published",
          detail: manualDone["manual-linkedin"]
            ? "Done ✓"
            : "Post LinkedIn copy from Orbit social pack. Best time: Tuesday 8–10am.",
          status: manualDone["manual-linkedin"] ? "done" : "missing",
          link: "https://www.linkedin.com/feed/",
          linkLabel: "LinkedIn →",
        },
        {
          id: "manual-indiehackers",
          label: "Indie Hackers product listed",
          detail: manualDone["manual-indiehackers"]
            ? "Done ✓"
            : "Add Svivva to indiehackers.com/products — write a milestone post. Great for early traction.",
          status: manualDone["manual-indiehackers"] ? "done" : "missing",
          link: "https://www.indiehackers.com/products",
          linkLabel: "IH →",
        },
        {
          id: "manual-newsletters",
          label: "Newsletter pitches sent (TLDR AI, Ben's Bites, etc.)",
          detail: manualDone["manual-newsletters"]
            ? "Done ✓"
            : "Copy pitch emails from Orbit outreach results → send from your inbox. Reach: 4M+ readers combined.",
          status: manualDone["manual-newsletters"] ? "done" : "missing",
          priority: "medium",
        },
        {
          id: "manual-podcasts",
          label: "Podcast pitches sent",
          detail: manualDone["manual-podcasts"]
            ? "Done ✓"
            : "Copy pitch emails from Orbit outreach results → send. AI/tech shows always need guests.",
          status: manualDone["manual-podcasts"] ? "done" : "missing",
          link: "/dashboard/growth",
          linkLabel: "Generate more →",
        },
        {
          id: "manual-gsc-indexing",
          label: "Key pages requested for Google indexing",
          detail: manualDone["manual-gsc-indexing"]
            ? "Done ✓"
            : "GSC → URL Inspection → paste each URL → Request Indexing. Do: /, /clutety, /blog, /tools, and 5-10 SEO pages.",
          status: manualDone["manual-gsc-indexing"] ? "done" : "missing",
          link: "https://search.google.com/search-console",
          linkLabel: "GSC →",
          priority: "high",
        },
      ],
    },
    {
      title: "Directory Submissions",
      emoji: "📁",
      tasks: [
        {
          id: "dir-producthunt",
          label: "Product Hunt listing",
          detail: manualDone["dir-producthunt"]
            ? "Done ✓"
            : "Submit Svivva to Product Hunt (separate from the launch — this is just getting listed)",
          status: manualDone["dir-producthunt"] ? "done" : "missing",
          link: "https://www.producthunt.com/posts/new",
          linkLabel: "Submit →",
          priority: "high",
        },
        {
          id: "dir-futurepedia",
          label: "Futurepedia submitted (500K/mo visitors)",
          detail: manualDone["dir-futurepedia"]
            ? "Done ✓"
            : "Use Growth Engine to track and open the submit link",
          status: manualDone["dir-futurepedia"] ? "done" : "missing",
          link: "/dashboard/growth",
          linkLabel: "Growth Engine →",
          priority: "high",
        },
        {
          id: "dir-taaft",
          label: "There's An AI For That (2M/mo visitors)",
          detail: manualDone["dir-taaft"]
            ? "Done ✓"
            : "Highest-traffic AI directory. Open via Growth Engine.",
          status: manualDone["dir-taaft"] ? "done" : "missing",
          link: "/dashboard/growth",
          linkLabel: "Growth Engine →",
          priority: "high",
        },
        {
          id: "dir-g2",
          label: "G2 listing created (8M/mo visitors)",
          detail: manualDone["dir-g2"]
            ? "Done ✓"
            : "Biggest SaaS review site. Requires a few reviews to rank but huge traffic.",
          status: manualDone["dir-g2"] ? "done" : "missing",
          link: "https://sell.g2.com",
          linkLabel: "G2 →",
          priority: "high",
        },
        {
          id: "dir-alternativeto",
          label: "AlternativeTo listed as Zapier alternative",
          detail: manualDone["dir-alternativeto"]
            ? "Done ✓"
            : "List Svivva AND mark it as alternative to Zapier, Make, n8n. Captures high-intent searches.",
          status: manualDone["dir-alternativeto"] ? "done" : "missing",
          link: "https://alternativeto.net/add-app/",
          linkLabel: "AlternativeTo →",
          priority: "high",
        },
        {
          id: "dir-crunchbase",
          label: "Crunchbase company page created",
          detail: manualDone["dir-crunchbase"]
            ? "Done ✓"
            : "Essential for startup credibility. High-DA backlink. Free to create.",
          status: manualDone["dir-crunchbase"] ? "done" : "missing",
          link: "https://www.crunchbase.com/add-new",
          linkLabel: "Crunchbase →",
          priority: "medium",
        },
        {
          id: "dir-growth-engine-overall",
          label: `Growth Engine: ${dirStats.submitted}/${dirStats.total} directories submitted`,
          detail:
            dirStats.submitted === 0
              ? "Open Growth Engine to start tracking directory submissions"
              : `${dirStats.live} live listings confirmed. ${dirStats.total - dirStats.submitted} directories remaining.`,
          status: dirStats.submitted === 0 ? "missing" : dirStats.live > 10 ? "done" : "warn",
          link: "/dashboard/growth",
          linkLabel: "Open Growth Engine →",
          priority: "high",
        },
      ],
    },
    {
      title: "Accounts & Presence",
      emoji: "🌐",
      tasks: [
        {
          id: "acc-email-list",
          label: "Email list set up (Substack or Beehiiv)",
          detail: manualDone["acc-email-list"]
            ? "Done ✓"
            : "Critical long-term asset. Create a free Beehiiv or Substack newsletter → link from your homepage. Even 100 subscribers compounds over months.",
          status: manualDone["acc-email-list"] ? "done" : "missing",
          link: "https://www.beehiiv.com",
          linkLabel: "Beehiiv →",
          priority: "high",
        },
        {
          id: "acc-twitter",
          label: "Twitter/X account active",
          detail: manualDone["acc-twitter"]
            ? "Done ✓"
            : "Consistent presence matters more than follower count. Post once/day using Growth Engine content.",
          status: manualDone["acc-twitter"] ? "done" : "missing",
          priority: "medium",
        },
        {
          id: "acc-linkedin",
          label: "LinkedIn company page created",
          detail: manualDone["acc-linkedin"]
            ? "Done ✓"
            : `Create company page → link from ${ORBIT_SITE} → adds credibility and a dofollow backlink.`,
          status: manualDone["acc-linkedin"] ? "done" : "missing",
          link: "https://www.linkedin.com/company/setup/new/",
          linkLabel: "LinkedIn →",
        },
        {
          id: "acc-powered-by",
          label: "'Powered by Svivva' widgets added to mini apps",
          detail: manualDone["acc-powered-by"]
            ? "Done ✓"
            : "Run 'Powered by Svivva Widget' step in Tools Repl tab → copy HTML to each mini app. Each mini app becomes a traffic referral channel.",
          status: orbitStepDone("mini-embed")
            ? manualDone["acc-powered-by"]
              ? "done"
              : "warn"
            : "missing",
          link: "/dashboard/launchpad",
          linkLabel: "Run in Orbit →",
          priority: "high",
        },
        {
          id: "acc-badge",
          label: "Developer 'Built with Svivva' badge deployed",
          detail: manualDone["acc-badge"]
            ? "Done ✓"
            : `Share ${ORBIT_SITE}/badge with users — each embed = a backlink + brand impression. Add the badge to your own GitHub repos too.`,
          status: manualDone["acc-badge"] ? "done" : "missing",
          link: "/badge",
          linkLabel: "Badge page →",
          priority: "medium",
        },
        {
          id: "acc-free-pr",
          label: "Press release submitted to PR sites",
          detail: manualDone["acc-free-pr"]
            ? "Done ✓"
            : "Use Growth Engine → AI Copy Engine → 'Press Release' → submit to PRLog, OpenPR, PR.com. All free, all indexed by Google within 24h.",
          status: manualDone["acc-free-pr"] ? "done" : "missing",
          link: "/dashboard/growth",
          linkLabel: "Generate PR →",
          priority: "medium",
        },
      ],
    },
    {
      title: "Recurring & Automated",
      emoji: "🔄",
      tasks: [
        {
          id: "auto-sitemap-pings",
          label: "Weekly sitemap pings to Google & Bing",
          detail: "Automated — runs every 24h via the SEO scheduler",
          status: "auto",
        },
        {
          id: "auto-growth-tasks",
          label: `Weekly growth tasks (last run: ${lastGrowthRun ? new Date(lastGrowthRun).toLocaleDateString() : "never"})`,
          detail: lastGrowthRun
            ? "Automated — sitemap pings + IndexNow every 7 days"
            : "Click 'Run Weekly Tasks' in Growth Engine to start",
          status: lastGrowthRun ? "auto" : "warn",
          link: "/dashboard/growth",
          linkLabel: "Growth Engine →",
        },
        {
          id: "auto-content-velocity",
          label: "Publishing new SEO content weekly",
          detail: manualDone["auto-content-velocity"]
            ? "Done ✓"
            : "Use Growth Engine → AI Copy Engine to generate a new blog outline or AEO piece weekly. Google rewards publishing frequency.",
          status: manualDone["auto-content-velocity"] ? "done" : "missing",
          link: "/dashboard/growth",
          linkLabel: "Generate content →",
          priority: "medium",
        },
      ],
    },
  ];

  // Compute overall score
  const allTasks = groups.flatMap((g) => g.tasks);
  const doneTasks = allTasks.filter((t) => {
    if (t.status === "auto") return true;
    if (t.status === "done") return true;
    if (
      t.id.startsWith("manual-") ||
      t.id.startsWith("acc-") ||
      t.id.startsWith("dir-") ||
      t.id === "auto-content-velocity"
    )
      return manualDone[t.id];
    return false;
  }).length;

  const highPriorityPending = allTasks
    .filter((t) => {
      if (t.priority !== "high") return false;
      if (t.status === "auto" || t.status === "done") return false;
      if (manualDone[t.id]) return false;
      return true;
    })
    .slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Score header */}
      <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-foreground uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: TEAL }} />
              Marketing Completion
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {doneTasks}/{allTasks.length} tasks complete
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black tabular-nums" style={{ color: TEAL }}>
              {Math.round((doneTasks / allTasks.length) * 100)}%
            </p>
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.round((doneTasks / allTasks.length) * 100)}%`,
              background: TEAL,
            }}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[10px]">
          <span className="flex items-center gap-1 text-emerald-500">
            <CheckCircle2 className="w-3 h-3" /> Done
          </span>
          <span className="flex items-center gap-1 text-[#5BA8A0]">
            <Zap className="w-3 h-3" /> Automated
          </span>
          <span className="flex items-center gap-1 text-amber-500">
            <AlertCircle className="w-3 h-3" /> Generated — needs posting
          </span>
          <span className="flex items-center gap-1 text-muted-foreground/60">
            <Circle className="w-3 h-3" /> Not done yet
          </span>
        </div>
      </div>

      {/* Next actions */}
      {highPriorityPending.length > 0 && (
        <div className="rounded-2xl border-2 border-amber-500/25 bg-amber-500/5 p-4 space-y-2">
          <p className="text-xs font-black text-amber-600 uppercase tracking-wide">
            ⚡ Do these next — highest impact
          </p>
          {highPriorityPending.map((t) => (
            <div key={t.id} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">{t.label}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{t.detail}</p>
                {t.link &&
                  (t.link.startsWith("http") ? (
                    <a
                      href={t.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#5BA8A0] hover:underline flex items-center gap-0.5"
                    >
                      {t.linkLabel} <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <Link href={t.link} className="text-[10px] text-[#5BA8A0] hover:underline">
                      {t.linkLabel}
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Groups */}
      {groups.map((group) => {
        const isOpen = expanded === group.title;
        const groupDone = group.tasks.filter((t) => {
          if (t.status === "auto" || t.status === "done") return true;
          return manualDone[t.id];
        }).length;

        return (
          <div
            key={group.title}
            className="rounded-2xl border-2 border-border bg-card overflow-hidden"
          >
            <button
              onClick={() => setExpanded(isOpen ? null : group.title)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{group.emoji}</span>
                <span className="text-xs font-bold text-foreground">{group.title}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background:
                      groupDone === group.tasks.length
                        ? "rgba(74,222,128,0.15)"
                        : "rgba(91,168,160,0.1)",
                    color: groupDone === group.tasks.length ? "#4ade80" : TEAL,
                  }}
                >
                  {groupDone}/{group.tasks.length}
                </span>
              </div>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-2 border-t border-border/50 pt-3">
                {group.tasks.map((task) => {
                  const isManualCheckable =
                    task.id.startsWith("manual-") ||
                    task.id.startsWith("acc-") ||
                    task.id.startsWith("dir-") ||
                    task.id === "auto-content-velocity" ||
                    ["tech-gsc-sitemap", "tech-schema-jsonld", "tech-rich-results"].includes(
                      task.id,
                    );
                  const effectiveStatus: TaskStatus =
                    isManualCheckable && manualDone[task.id] ? "done" : task.status;

                  return (
                    <div
                      key={task.id}
                      className={`rounded-xl border px-3 py-2.5 flex items-start gap-2.5 ${statusBg(effectiveStatus)}`}
                    >
                      {isManualCheckable ? (
                        <button
                          onClick={() => toggleManual(task.id)}
                          className="mt-0.5 flex-shrink-0 focus:outline-none"
                          data-testid={`checkbox-${task.id}`}
                        >
                          {manualDone[task.id] ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
                          )}
                        </button>
                      ) : (
                        statusIcon(effectiveStatus)
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-foreground leading-tight">
                            {task.label}
                          </p>
                          {task.priority === "high" &&
                            effectiveStatus !== "done" &&
                            effectiveStatus !== "auto" && (
                              <span className="text-[9px] bg-red-500/15 text-red-500 px-1 py-0.5 rounded font-bold flex-shrink-0">
                                HIGH
                              </span>
                            )}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                          {task.detail}
                        </p>
                        {task.link && effectiveStatus !== "done" && (
                          <div className="mt-1">
                            {task.link.startsWith("http") ? (
                              <a
                                href={task.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-[#5BA8A0] hover:underline flex items-center gap-0.5"
                              >
                                {task.linkLabel} <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <Link
                                href={task.link}
                                className="text-[10px] text-[#5BA8A0] hover:underline"
                              >
                                {task.linkLabel}
                              </Link>
                            )}
                          </div>
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

      {/* Growth Engine card */}
      <div className="rounded-2xl border-2 border-[#5BA8A0]/30 bg-[#5BA8A0]/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black text-foreground flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: TEAL }} />
              Growth Engine — Continuous Marketing
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {dirStats.submitted}/{dirStats.total} directories submitted · {dirStats.live} live ·
              AI content generator · 8 novel tactics · weekly automation
            </p>
          </div>
          <Link
            href="/dashboard/growth"
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white"
            style={{ background: TEAL }}
          >
            Open <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
