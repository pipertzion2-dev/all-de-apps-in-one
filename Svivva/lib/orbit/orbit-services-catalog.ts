import type { MarketingPlatformCredentials } from "./marketing-autopilot-types";

/** How a service is billed — indexing tools are free Google/Bing APIs, not AI. */
export type OrbitServiceBilling = "paid" | "free" | "free-tier-paid-upgrade";

export type OrbitServiceCategory =
  | "indexing"
  | "automation"
  | "ai-marketing"
  | "distribution"
  | "analytics"
  | "free-fallback";

export type OrbitServiceItem = {
  id: string;
  category: OrbitServiceCategory;
  billing: OrbitServiceBilling;
  name: string;
  priceLabel: string;
  purpose: string;
  /**
   * Exact free allowance, when the service has a permanent free tier. Shown in
   * admin so the $0 path is verifiable rather than implied. Omit when the
   * service has no free tier (a trial is not a free tier).
   */
  freeTier?: string;
  /** Short setup steps shown in admin */
  steps: string[];
  payUrl?: string;
  docsUrl?: string;
  /** In-app setup (Platform Secrets, GSC, paste key below) */
  setupHref?: string;
  setupLabel?: string;
  envKey?: string;
  credentialKey?: keyof MarketingPlatformCredentials;
  payNote?: string;
  /** Orbit's recommended pick for this job — best results vs budget alternatives */
  bestPick?: boolean;
  priority: number;
};

/** Ordered best stack — what Orbit admin recommends for maximum funnel results. */
export const ORBIT_BEST_STACK: { step: number; id: string; why: string }[] = [
  {
    step: 1,
    id: "gsc-oauth",
    why: "Only official path to Google indexing — no AI replaces this",
  },
  {
    step: 2,
    id: "openai",
    why: "gpt-4o writes the highest-quality SEO pages, social packs & outreach",
  },
  {
    step: 3,
    id: "n8n",
    why: "One webhook orchestrates social, email, CRM & Slack from Orbit JSON",
  },
  {
    step: 4,
    id: "ayrshare",
    why: "Best multi-platform social API (LinkedIn, X, Threads, Reddit) — direct or inside n8n",
  },
  {
    step: 5,
    id: "resend",
    why: "Best developer email API for newsletter & podcast pitches",
  },
  {
    step: 6,
    id: "clarity",
    why: "Free heatmaps & session replay — see what converts after traffic lands",
  },
];

/**
 * Ordered $0 path — completes Orbit and SEO end to end on permanent free tiers.
 * Every step is either a free Google/Bing API, a free-tier SaaS, or open-source
 * software you self-host. No trials, no cards.
 */
export const ORBIT_FREE_STACK: { step: number; id: string; why: string }[] = [
  {
    step: 1,
    id: "gsc-oauth",
    why: "Free and the only official route into Google — connect this before anything else",
  },
  {
    step: 2,
    id: "indexnow",
    why: "Free instant Bing/Yandex pings — Orbit creates the key on your first autopilot run",
  },
  {
    step: 3,
    id: "bing-webmaster",
    why: "Free crawl diagnostics to confirm the IndexNow pings landed",
  },
  {
    step: 4,
    id: "gemini",
    why: "Free AI tier writes the SEO pages and social copy — no OpenAI billing needed",
  },
  {
    step: 5,
    id: "n8n",
    why: "Self-hosted Community edition is free forever with unlimited executions",
  },
  {
    step: 6,
    id: "postiz",
    why: "Free open-source social auto-posting — the $0 replacement for Ayrshare",
  },
  {
    step: 7,
    id: "resend",
    why: "Free tier covers 3,000 outreach emails a month (100/day)",
  },
  {
    step: 8,
    id: "clarity",
    why: "Free heatmaps and session replay, no sampling limits",
  },
];

/** Google indexing is NOT an AI product — separate from paid marketing APIs. */
export const ORBIT_INDEXING_SERVICES: OrbitServiceItem[] = [
  {
    id: "gsc-oauth",
    category: "indexing",
    billing: "free",
    name: "Google Search Console (OAuth)",
    priceLabel: "Free",
    freeTier: "Free with no quota — this is Google's own webmaster product.",
    bestPick: true,
    purpose:
      "Proper Google indexing starts here — verify zzaizzai.com, submit sitemap, request indexing. No AI service replaces this.",
    steps: [
      "Press the camo orb on Launchpad → sign in with Google",
      "Add your site in Search Console if prompted",
      "Submit sitemap: your-domain.com/sitemap.xml",
    ],
    setupHref: "/dashboard/launchpad#orbit-one-click",
    setupLabel: "Connect orb on Launchpad",
    docsUrl: "https://search.google.com/search-console",
    priority: 1,
  },
  {
    id: "gsc-service-account",
    category: "indexing",
    billing: "free",
    name: "GSC API + Google Indexing API",
    priceLabel: "Free (Google Cloud)",
    freeTier: "Free — a Google Cloud service account costs nothing; 200 URLs/day indexing quota.",
    bestPick: true,
    purpose:
      "Lets Orbit auto-submit your sitemap and nudge Google to crawl new URLs. Uses a Google service account — not OpenAI or any LLM.",
    steps: [
      "Create a service account in Google Cloud → enable Search Console API",
      "Add the service account email as Owner in Search Console",
      "Paste JSON at Dashboard → GSC service account setup",
    ],
    setupHref: "/dashboard/gsc-connect",
    setupLabel: "Paste service account JSON",
    docsUrl: "https://developers.google.com/webmaster-tools/v1/how-tos/search-console",
    priority: 2,
  },
  {
    id: "indexnow",
    category: "indexing",
    billing: "free",
    name: "IndexNow (Bing, Yandex, Yahoo)",
    priceLabel: "Free · auto",
    freeTier: "Free open protocol — no account or key purchase needed.",
    bestPick: true,
    purpose:
      "Instant pings to Bing and other engines. Google ignores IndexNow — use GSC above for Google.",
    steps: ["Run Orbit autopilot once — IndexNow key is created automatically"],
    priority: 3,
  },
  {
    id: "bing-webmaster",
    category: "indexing",
    billing: "free",
    name: "Bing Webmaster Tools",
    priceLabel: "Free",
    freeTier: "Free — Microsoft's own webmaster product, no quota.",
    purpose:
      "Verify your site and monitor Bing search performance. Complements IndexNow auto-pings with crawl diagnostics.",
    steps: [
      "Sign in at bing.com/webmasters with Microsoft account",
      "Add & verify your domain (DNS or CNAME)",
      "Submit sitemap — Orbit already pings Bing on each autopilot run",
    ],
    payUrl: "https://www.bing.com/webmasters",
    docsUrl: "https://www.bing.com/webmasters/help/add-and-verify-site-12a3c2b8",
    priority: 4,
  },
];

/** Paid (or paid-upgrade) services for full marketing automation. */
export const ORBIT_PAID_SERVICES: OrbitServiceItem[] = [
  {
    id: "n8n",
    category: "automation",
    billing: "free-tier-paid-upgrade",
    name: "n8n (funnel orchestration)",
    priceLabel: "Free self-host · ~$20/mo cloud",
    freeTier:
      "Community edition is free forever when self-hosted: unlimited workflows and executions, every node. Cloud has no permanent free tier.",
    bestPick: true,
    purpose:
      "Best way to wire the full funnel — Orbit POSTs your marketing pack JSON after each run. Route to Ayrshare, Resend, HubSpot, Slack, or CRM nodes.",
    steps: [
      "Create an n8n workflow with a Webhook node → copy the Production URL",
      "Optional: verify X-Orbit-Secret header in n8n for auth",
      "Paste webhook URL in Launchpad credentials below",
      "Add Ayrshare / Resend / HTTP nodes to publish from the JSON payload",
    ],
    payUrl: "https://n8n.io/pricing",
    docsUrl: "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/",
    setupLabel: "Paste webhook below",
    credentialKey: "n8nWebhookUrl",
    payNote: "Self-host on your VPS for free, or use n8n Cloud.",
    priority: 0,
  },
  {
    id: "openai",
    category: "ai-marketing",
    billing: "paid",
    name: "OpenAI gpt-4o",
    priceLabel: "~$10–30 prepaid",
    purpose:
      "Best LLM for marketing copy — long-form SEO pages, comparison posts, social threads, and outreach pitches. Orbit defaults to gpt-4o when your sk- key is set.",
    steps: [
      "Add billing at OpenAI → create sk- API key",
      "Paste in Platform Secrets or Vercel OPENAI_API_KEY",
      "Optional override: ORBIT_AI_MODEL=gpt-4.1 in host env",
      "Redeploy → confirm Marketing AI shows ready",
    ],
    payUrl: "https://platform.openai.com/settings/organization/billing/overview",
    docsUrl: "https://platform.openai.com/api-keys",
    setupHref: "/dashboard/settings/runtime-keys",
    setupLabel: "Platform Secrets",
    envKey: "OPENAI_API_KEY",
    payNote: "Orbit uses gpt-4o for marketing (not mini) when OpenAI is configured.",
    priority: 1,
  },
  {
    id: "easypeasy",
    category: "ai-marketing",
    billing: "paid",
    name: "EasyPeasy.AI",
    priceLabel: "Credits · easy-peasy.ai",
    purpose:
      "OpenAI-compatible gateway for Orbit marketing — default model gemini-3-flash. Same SEO/autopilot jobs without an OpenAI sk- key.",
    steps: [
      "Sign up at easy-peasy.ai → Settings → API → create key",
      "Paste key in Launchpad EasyPeasy card (or EASYPEASY_API_KEY in Vercel)",
      "Optional: EASYPEASY_MODEL=gemini-3-flash in Vercel",
      "Tap Test connection → run Marketing Autopilot",
    ],
    payUrl: "https://easy-peasy.ai/pricing",
    docsUrl: "https://docs.easy-peasy.ai/api-reference/endpoint/chat-completions",
    setupHref: "/dashboard/launchpad#orbit-easypeasy-setup",
    setupLabel: "EasyPeasy card on Launchpad",
    envKey: "EASYPEASY_API_KEY",
    payNote: "Uses https://easy-peasy.ai/api — OpenAI SDK compatible.",
    bestPick: true,
    priority: 1,
  },
  {
    id: "ayrshare",
    category: "distribution",
    billing: "paid",
    name: "Ayrshare",
    priceLabel: "$149/mo+ · no free tier",
    purpose:
      "Managed multi-platform social API — LinkedIn, X, Threads, Bluesky, Reddit in one call. Convenient, but the cheapest plan is $149/mo for a single profile.",
    steps: [
      "Sign up at ayrshare.com → connect LinkedIn + X in dashboard",
      "Create API key → paste in Launchpad credentials",
      "Orbit auto-posts launch copy on each autopilot run",
    ],
    payUrl: "https://www.ayrshare.com/pricing/",
    docsUrl: "https://www.ayrshare.com/docs/apis/post/post",
    setupLabel: "Paste key below",
    credentialKey: "ayrshareApiKey",
    payNote:
      "No permanent free tier — only a 28-day trial on the $299 Launch plan. Use Postiz (free) or n8n for a $0 path.",
    priority: 2,
  },
  {
    id: "resend",
    category: "distribution",
    billing: "free-tier-paid-upgrade",
    name: "Resend",
    priceLabel: "Free 3,000/mo → $20/mo",
    freeTier: "3,000 emails/month, capped at 100/day, up to 3 verified domains.",
    bestPick: true,
    purpose:
      "Best developer email API for newsletter & podcast pitches — high deliverability, simple REST API.",
    steps: [
      "Sign up at resend.com → verify your sending domain",
      "Create API key → paste in Launchpad credentials",
      "Or route email sends through n8n instead",
    ],
    payUrl: "https://resend.com/signup",
    docsUrl: "https://resend.com/docs/api-reference/emails/send-email",
    setupLabel: "Paste key below",
    credentialKey: "resendApiKey",
    priority: 3,
  },
  {
    id: "omnisocials",
    category: "distribution",
    billing: "paid",
    name: "OmniSocials (budget social)",
    priceLabel: "$10/mo",
    purpose:
      "Budget LinkedIn & X auto-post if you skip Ayrshare — good enough for basic launch threads.",
    steps: [
      "Subscribe at omnisocials.com → connect LinkedIn + X",
      "Settings → API → create key",
      "Paste key in Launchpad credentials below",
    ],
    payUrl: "https://www.omnisocials.com/pricing",
    docsUrl: "https://docs.omnisocials.com/introduction",
    setupLabel: "Paste key below",
    credentialKey: "omnisocialsApiKey",
    payNote: "Use Ayrshare for best reach; OmniSocials is the low-cost alternative.",
    priority: 4,
  },
];

/** Free analytics & measurement — not required for autopilot but best for optimizing results. */
export const ORBIT_ANALYTICS_SERVICES: OrbitServiceItem[] = [
  {
    id: "clarity",
    category: "analytics",
    billing: "free",
    name: "Microsoft Clarity",
    priceLabel: "Free",
    freeTier: "Free with no traffic cap or sampling limit.",
    bestPick: true,
    purpose:
      "Best free analytics for founders — heatmaps, scroll maps, and session recordings on zzaizzai.com.",
    steps: [
      "Create project at clarity.microsoft.com",
      "Copy project ID → NEXT_PUBLIC_CLARITY_ID in Platform Secrets / Vercel",
      "Redeploy — heatmaps appear within hours",
    ],
    payUrl: "https://clarity.microsoft.com",
    docsUrl: "https://learn.microsoft.com/en-us/clarity/",
    setupHref: "/dashboard/settings/runtime-keys",
    setupLabel: "Platform Secrets",
    envKey: "NEXT_PUBLIC_CLARITY_ID",
    priority: 1,
  },
];

/**
 * Permanent free tiers that complete the same jobs as the paid stack. These are
 * the services referenced by ORBIT_FREE_STACK.
 */
export const ORBIT_FREE_STACK_SERVICES: OrbitServiceItem[] = [
  {
    id: "postiz",
    category: "distribution",
    billing: "free",
    name: "Postiz (free social auto-post)",
    priceLabel: "Free · self-hosted",
    freeTier: "Unlimited posts and channels when self-hosted (AGPL). You only pay for the server.",
    bestPick: true,
    purpose:
      "Open-source social posting across 30+ channels — the $0 replacement for Ayrshare. Orbit posts your launch copy to X, LinkedIn, Mastodon, Bluesky, Telegram & Threads through its API.",
    steps: [
      "Self-host with docker compose (2 vCPU / 2 GB is enough) or use Postiz cloud",
      "Connect your channels inside Postiz",
      "Settings → generate an API key",
      "Paste the instance URL + key in Launchpad credentials below",
    ],
    payUrl: "https://github.com/gitroomhq/postiz-app",
    docsUrl: "https://docs.postiz.com/public-api",
    setupLabel: "Paste key below",
    credentialKey: "postizApiKey",
    payNote:
      "Self-hosting keeps it free and removes per-channel fees. Rate limit is 90 create-post calls/hour.",
    priority: 1,
  },
];

export const ORBIT_FREE_FALLBACK_SERVICES: OrbitServiceItem[] = [
  {
    id: "gemini",
    category: "free-fallback",
    billing: "free",
    name: "Google Gemini (free AI)",
    priceLabel: "Free tier",
    freeTier: "Free tier via Google AI Studio — enough for daily Orbit content runs.",
    bestPick: true,
    purpose:
      "Free AI for Orbit copy. Lower marketing quality than OpenAI gpt-4o, but it makes the whole $0 path work with no billing set up.",
    steps: [
      "Get a key at Google AI Studio",
      "Add GEMINI_API_KEY in Platform Secrets / Vercel",
      "Optional: set ORBIT_AI_PROVIDER=gemini to prefer it over OpenAI",
    ],
    payUrl: "https://aistudio.google.com/apikey",
    docsUrl: "https://ai.google.dev/gemini-api/docs",
    setupHref: "/dashboard/settings/runtime-keys",
    setupLabel: "Platform Secrets",
    envKey: "GEMINI_API_KEY",
    priority: 10,
  },
];

export const ORBIT_SERVICE_CATEGORY_LABELS: Record<OrbitServiceCategory, string> = {
  indexing: "Google & search indexing (free — not AI)",
  automation: "Best — n8n funnel orchestration",
  "ai-marketing": "AI marketing copy",
  distribution: "Social & email APIs (free and paid)",
  analytics: "Best — free conversion analytics",
  "free-fallback": "Free AI (no OpenAI billing needed)",
};

/** Lookup a service item by id across all catalogs. */
export function orbitServiceById(id: string): OrbitServiceItem | undefined {
  return [
    ...ORBIT_INDEXING_SERVICES,
    ...ORBIT_PAID_SERVICES,
    ...ORBIT_FREE_STACK_SERVICES,
    ...ORBIT_ANALYTICS_SERVICES,
    ...ORBIT_FREE_FALLBACK_SERVICES,
  ].find((s) => s.id === id);
}

/**
 * Resolved ORBIT_FREE_STACK entries. Every step must exist in a catalog, so an
 * unknown id is dropped rather than rendered as a blank row.
 */
export function orbitFreeStackServices(): { step: number; why: string; item: OrbitServiceItem }[] {
  return ORBIT_FREE_STACK.flatMap(({ step, id, why }) => {
    const item = orbitServiceById(id);
    return item ? [{ step, why, item }] : [];
  });
}

/** True when a service can be completed on a permanent free tier. */
export function isOrbitFreeTierService(item: OrbitServiceItem): boolean {
  return item.billing === "free" || item.billing === "free-tier-paid-upgrade";
}
