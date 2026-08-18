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
  bestPick?: boolean;
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
      "Best funnel orchestration — Orbit POSTs social, outreach & indexing JSON to your n8n webhook",
    priceLabel: "Free self-host · $20/mo cloud",
    payUrl: "https://n8n.io/pricing",
    docsUrl: "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/",
    payNote:
      "Wire Ayrshare + Resend inside n8n instead of pasting keys separately. Webhook node → paste Production URL below.",
    credentialKey: "n8nWebhookUrl",
    bestPick: true,
    priority: 0,
  },
  {
    id: "openai",
    name: "OpenAI gpt-4o",
    purpose: "Best AI for Orbit marketing — SEO pages, launch copy, outreach, and autopilot",
    priceLabel: "~$10–30 prepaid credits",
    payUrl: "https://platform.openai.com/settings/organization/billing/overview",
    docsUrl: "https://platform.openai.com/api-keys",
    payNote:
      "Orbit defaults to gpt-4o (not mini) for marketing quality. Paste sk- key in Platform Secrets or Vercel.",
    envKey: "OPENAI_API_KEY",
    bestPick: true,
    priority: 1,
  },
  {
    id: "ayrshare",
    name: "Ayrshare",
    purpose: "Best social API — LinkedIn, X, Threads, Bluesky, Reddit in one call",
    priceLabel: "~$49/mo API",
    payUrl: "https://www.ayrshare.com/pricing/",
    docsUrl: "https://www.ayrshare.com/docs/apis/post/post",
    payNote:
      "Connect accounts in Ayrshare dashboard, create API key, paste below — or call from n8n.",
    credentialKey: "ayrshareApiKey",
    bestPick: true,
    priority: 2,
  },
  {
    id: "resend",
    name: "Resend",
    purpose: "Best developer email API for newsletter & podcast pitch automation",
    priceLabel: "Free tier → $20/mo",
    payUrl: "https://resend.com/signup",
    docsUrl: "https://resend.com/docs/api-reference/emails/send-email",
    payNote: "Verify your domain, paste API key below — or send via n8n Resend node.",
    credentialKey: "resendApiKey",
    bestPick: true,
    priority: 3,
  },
  {
    id: "omnisocials",
    name: "OmniSocials (budget)",
    purpose: "Budget LinkedIn & X auto-post if you skip Ayrshare ($10/mo)",
    priceLabel: "$10/mo flat",
    payUrl: "https://www.omnisocials.com/pricing",
    docsUrl: "https://docs.omnisocials.com/introduction",
    payNote: "Lower cost than Ayrshare — use when basic X + LinkedIn posting is enough.",
    credentialKey: "omnisocialsApiKey",
    priority: 4,
  },
  {
    id: "clarity",
    name: "Microsoft Clarity (free)",
    purpose: "Best free heatmaps & session replay — see what converts after Orbit drives traffic",
    priceLabel: "Free",
    payUrl: "https://clarity.microsoft.com",
    docsUrl: "https://learn.microsoft.com/en-us/clarity/",
    payNote: "Create project → NEXT_PUBLIC_CLARITY_ID in Platform Secrets → redeploy.",
    envKey: "NEXT_PUBLIC_CLARITY_ID",
    bestPick: true,
    priority: 5,
  },
  {
    id: "gemini",
    name: "Google Gemini (free fallback)",
    purpose: "Free AI alternative if you skip OpenAI — lower quality for marketing",
    priceLabel: "Free tier",
    payUrl: "https://aistudio.google.com/apikey",
    docsUrl: "https://ai.google.dev/gemini-api/docs",
    payNote:
      "Fallback only when OpenAI is not configured (unless ORBIT_AI_PROVIDER=gemini).",
    envKey: "GEMINI_API_KEY",
    priority: 10,
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
    "Wire Ayrshare / Resend nodes",
  ],
  "dir-futurepedia": ["Copy listing", "Open directory", "Paste fields", "Submit", "Tap Done"],
  "dir-taaft": ["Copy listing", "Open TAAFT", "Paste fields", "Submit", "Tap Done"],
  "dir-g2": ["Copy listing", "Open G2", "Paste fields", "Submit", "Tap Done"],
};

export function stepsForTask(taskId: string): string[] {
  return MANUAL_TASK_STEPS[taskId] ?? MANUAL_TASK_STEPS.default;
}
