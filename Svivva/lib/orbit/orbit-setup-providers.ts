import type { MarketingPlatformCredentials } from "./marketing-autopilot-types";

/** Paid / free services Orbit recommends — pay links work with Apple Pay in Safari on Mac/iPhone. */
export type OrbitSetupProvider = {
  id: string;
  name: string;
  purpose: string;
  priceLabel: string;
  /** Checkout or billing page — Stripe/OpenAI billing supports Apple Pay in Safari */
  payUrl: string;
  docsUrl: string;
  payNote: string;
  /** Saved in launchpad credentials (server-side DB) */
  credentialKey?: keyof MarketingPlatformCredentials;
  /** Vercel env var (server-only) */
  envKey?: string;
  priority: number;
};

export const ORBIT_SETUP_PROVIDERS: OrbitSetupProvider[] = [
  {
    id: "n8n",
    name: "n8n",
    purpose:
      "Funnel automation — Orbit POSTs social, outreach & indexing JSON to your n8n webhook after each run",
    priceLabel: "Free self-host · $20/mo cloud",
    payUrl: "https://n8n.io/pricing",
    docsUrl: "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/",
    payNote:
      "Recommended over wiring OmniSocials + Resend separately. Create a Webhook node workflow, paste the Production URL below. Optional X-Orbit-Secret header for auth.",
    credentialKey: "n8nWebhookUrl",
    priority: 0,
  },
  {
    id: "openai",
    name: "OpenAI",
    purpose: "Paid AI for Orbit marketing — SEO pages, launch copy, outreach, and autopilot",
    priceLabel: "~$5–20 prepaid credits",
    payUrl: "https://platform.openai.com/settings/organization/billing/overview",
    docsUrl: "https://platform.openai.com/api-keys",
    payNote:
      "Add billing in Safari (Apple Pay accepted), create an sk- API key, then paste in Vercel env or Dashboard → Platform Secrets. Orbit prefers OpenAI when this key is set.",
    envKey: "OPENAI_API_KEY",
    priority: 1,
  },
  {
    id: "omnisocials",
    name: "OmniSocials",
    purpose: "Auto-post LinkedIn & X — one key replaces $100/mo Twitter API",
    priceLabel: "$10/mo flat",
    payUrl: "https://www.omnisocials.com/pricing",
    docsUrl: "https://docs.omnisocials.com/introduction",
    payNote:
      "Subscribe in Safari (Apple Pay via Stripe). Connect LinkedIn + X in dashboard → Settings → API.",
    credentialKey: "omnisocialsApiKey",
    priority: 2,
  },
  {
    id: "resend",
    name: "Resend",
    purpose: "Auto-send newsletter & podcast pitch emails",
    priceLabel: "Free tier → $20/mo",
    payUrl: "https://resend.com/signup",
    docsUrl: "https://resend.com/docs/api-reference/emails/send-email",
    payNote:
      "Sign up in Safari — Apple Pay on paid plans. Paste API key below after verifying your domain.",
    credentialKey: "resendApiKey",
    priority: 3,
  },
  {
    id: "gemini",
    name: "Google Gemini (free)",
    purpose: "Free AI alternative if you skip OpenAI",
    priceLabel: "Free tier",
    payUrl: "https://aistudio.google.com/apikey",
    docsUrl: "https://ai.google.dev/gemini-api/docs",
    payNote:
      "Free fallback when OpenAI is not configured. Orbit uses Gemini only if no paid OpenAI key is present (unless ORBIT_AI_PROVIDER=gemini).",
    envKey: "GEMINI_API_KEY",
    priority: 4,
  },
];

/** Short steps shown on manual “finish in N taps” cards */
export const MANUAL_TASK_STEPS: Record<string, string[]> = {
  default: ["Tap Copy", "Tap Open", "Paste into the form", "Publish", "Tap Done"],
  "manual-producthunt": [
    "Copy listing",
    "Open Product Hunt",
    "Paste tagline + description",
    "Add screenshots & launch",
    "Tap Done",
  ],
  "manual-showhn": ["Copy post", "Open HN submit", "Paste title + URL", "Submit", "Tap Done"],
  "manual-newsletters": [
    "Add n8n webhook or Resend key (or copy pitch)",
    "Open your email client",
    "Paste pitch & send",
    "Tap Done",
  ],
  "auto-n8n-webhook": [
    "Create n8n Webhook node workflow",
    "Copy Production URL",
    "Paste below & save",
    "Run autopilot — JSON arrives in n8n",
    "Wire LinkedIn / email nodes",
  ],
  "dir-futurepedia": ["Copy listing", "Open directory", "Paste fields", "Submit", "Tap Done"],
  "dir-taaft": ["Copy listing", "Open TAAFT", "Paste fields", "Submit", "Tap Done"],
  "dir-g2": ["Copy listing", "Open G2", "Paste fields", "Submit", "Tap Done"],
};

export function stepsForTask(taskId: string): string[] {
  return MANUAL_TASK_STEPS[taskId] ?? MANUAL_TASK_STEPS.default;
}
