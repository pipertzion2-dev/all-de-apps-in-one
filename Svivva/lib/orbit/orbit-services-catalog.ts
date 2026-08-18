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

/** Google indexing is NOT an AI product — separate from paid marketing APIs. */
export const ORBIT_INDEXING_SERVICES: OrbitServiceItem[] = [
  {
    id: "gsc-oauth",
    category: "indexing",
    billing: "free",
    name: "Google Search Console (OAuth)",
    priceLabel: "Free",
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
    priceLabel: "Free self-host · $20/mo cloud",
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
    bestPick: true,
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
    id: "ayrshare",
    category: "distribution",
    billing: "paid",
    name: "Ayrshare",
    priceLabel: "~$49/mo API",
    bestPick: true,
    purpose:
      "Best direct social API — LinkedIn, X, Threads, Bluesky, Reddit & more in one call. Use here or inside your n8n workflow.",
    steps: [
      "Sign up at ayrshare.com → connect LinkedIn + X in dashboard",
      "Create API key → paste in Launchpad credentials",
      "Orbit auto-posts launch copy on each autopilot run",
    ],
    payUrl: "https://www.ayrshare.com/pricing/",
    docsUrl: "https://www.ayrshare.com/docs/apis/post/post",
    setupLabel: "Paste key below",
    credentialKey: "ayrshareApiKey",
    payNote: "Industry-standard social API — better reach than budget schedulers.",
    priority: 2,
  },
  {
    id: "resend",
    category: "distribution",
    billing: "free-tier-paid-upgrade",
    name: "Resend",
    priceLabel: "Free → $20/mo",
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

export const ORBIT_FREE_FALLBACK_SERVICES: OrbitServiceItem[] = [
  {
    id: "gemini",
    category: "free-fallback",
    billing: "free",
    name: "Google Gemini",
    priceLabel: "Free tier",
    purpose: "Fallback AI only if no OpenAI key — not recommended for production marketing runs.",
    steps: ["Get key at Google AI Studio → GEMINI_API_KEY in Vercel"],
    payUrl: "https://aistudio.google.com/apikey",
    docsUrl: "https://ai.google.dev/gemini-api/docs",
    envKey: "GEMINI_API_KEY",
    priority: 10,
  },
];

export const ORBIT_SERVICE_CATEGORY_LABELS: Record<OrbitServiceCategory, string> = {
  indexing: "Google & search indexing (free — not AI)",
  automation: "Best — n8n funnel orchestration",
  "ai-marketing": "Best — AI marketing copy (gpt-4o)",
  distribution: "Best — social & email APIs",
  analytics: "Best — free conversion analytics",
  "free-fallback": "Optional free fallback",
};

/** Lookup a service item by id across all catalogs. */
export function orbitServiceById(id: string): OrbitServiceItem | undefined {
  return [
    ...ORBIT_INDEXING_SERVICES,
    ...ORBIT_PAID_SERVICES,
    ...ORBIT_ANALYTICS_SERVICES,
    ...ORBIT_FREE_FALLBACK_SERVICES,
  ].find((s) => s.id === id);
}
