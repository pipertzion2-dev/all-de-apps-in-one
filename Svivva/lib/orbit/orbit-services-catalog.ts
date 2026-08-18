import type { MarketingPlatformCredentials } from "./marketing-autopilot-types";

/** How a service is billed — indexing tools are free Google/Bing APIs, not AI. */
export type OrbitServiceBilling = "paid" | "free" | "free-tier-paid-upgrade";

export type OrbitServiceCategory =
  | "indexing"
  | "automation"
  | "ai-marketing"
  | "distribution"
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
  priority: number;
};

/** Google indexing is NOT an AI product — separate from paid marketing APIs. */
export const ORBIT_INDEXING_SERVICES: OrbitServiceItem[] = [
  {
    id: "gsc-oauth",
    category: "indexing",
    billing: "free",
    name: "Google Search Console (OAuth)",
    priceLabel: "Free",
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
    purpose:
      "Instant pings to Bing and other engines. Google ignores IndexNow — use GSC above for Google.",
    steps: ["Run Orbit autopilot once — IndexNow key is created automatically"],
    priority: 3,
  },
];

/** Paid (or paid-upgrade) services for full marketing automation. */
export const ORBIT_PAID_SERVICES: OrbitServiceItem[] = [
  {
    id: "n8n",
    category: "automation",
    billing: "free-tier-paid-upgrade",
    name: "n8n (funnel automation)",
    priceLabel: "Free self-host · $20/mo cloud",
    purpose:
      "Recommended — Orbit POSTs your full marketing pack to an n8n webhook after each run. Wire LinkedIn, email, CRM, and Slack in one graph instead of separate OmniSocials + Resend keys.",
    steps: [
      "Create an n8n workflow with a Webhook node → copy the Production URL",
      "Optional: verify X-Orbit-Secret header in n8n for auth",
      "Paste webhook URL in Launchpad credentials below",
      "Add HTTP Request / OmniSocials / Resend nodes to publish from the JSON payload",
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
    name: "OpenAI (your LLM)",
    priceLabel: "~$5–20 prepaid",
    purpose:
      "Required for AI-written SEO pages, blog posts, social packs, and outreach. Use your own sk- key or OpenAI-compatible gateway.",
    steps: [
      "Add billing at OpenAI → create sk- API key",
      "Paste in Platform Secrets or Vercel OPENAI_API_KEY",
      "Optional: ORBIT_AI_MODEL=gpt-4o-mini in host env",
      "Redeploy → confirm Marketing AI shows ready",
    ],
    payUrl: "https://platform.openai.com/settings/organization/billing/overview",
    docsUrl: "https://platform.openai.com/api-keys",
    setupHref: "/dashboard/settings/runtime-keys",
    setupLabel: "Platform Secrets",
    envKey: "OPENAI_API_KEY",
    payNote: "Orbit prefers this over free Gemini when configured.",
    priority: 1,
  },
  {
    id: "omnisocials",
    category: "distribution",
    billing: "paid",
    name: "OmniSocials",
    priceLabel: "$10/mo",
    purpose:
      "Direct auto-post LinkedIn & X — optional if you route social through n8n instead.",
    steps: [
      "Subscribe at omnisocials.com → connect LinkedIn + X",
      "Settings → API → create key",
      "Paste key in Launchpad credentials below",
    ],
    payUrl: "https://www.omnisocials.com/pricing",
    docsUrl: "https://docs.omnisocials.com/introduction",
    setupLabel: "Paste key below",
    credentialKey: "omnisocialsApiKey",
    priority: 2,
  },
  {
    id: "resend",
    category: "distribution",
    billing: "free-tier-paid-upgrade",
    name: "Resend",
    priceLabel: "Free → $20/mo",
    purpose:
      "Direct email send for newsletter & podcast pitches — optional if you route outreach through n8n.",
    steps: [
      "Sign up at resend.com → verify your sending domain",
      "Create API key → paste in Launchpad credentials",
    ],
    payUrl: "https://resend.com/signup",
    docsUrl: "https://resend.com/docs/api-reference/emails/send-email",
    setupLabel: "Paste key below",
    credentialKey: "resendApiKey",
    priority: 3,
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
  automation: "Recommended — n8n funnel automation",
  "ai-marketing": "Paid — AI marketing copy",
  distribution: "Paid — auto-post & email (or use n8n)",
  "free-fallback": "Optional free fallback",
};
