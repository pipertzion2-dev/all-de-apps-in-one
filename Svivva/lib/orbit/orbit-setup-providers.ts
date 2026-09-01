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
      "Wire Postiz + Resend inside n8n instead of pasting keys separately. Webhook node → paste Production URL below.",
    credentialKey: "n8nWebhookUrl",
    bestPick: true,
    priority: 0,
  },
  {
    id: "openai",
    name: "OpenAI gpt-5",
    purpose: "Best AI for Orbit marketing — SEO pages, launch copy, outreach, and autopilot",
    priceLabel: "~$10–30 prepaid credits",
    payUrl: "https://platform.openai.com/settings/organization/billing/overview",
    docsUrl: "https://platform.openai.com/api-keys",
    payNote:
      "Orbit defaults to gpt-5 (falls back to gpt-4o) for marketing quality. Paste sk- key in Platform Secrets or Vercel. Gemini's free tier covers the same jobs at $0.",
    envKey: "OPENAI_API_KEY",
    priority: 10,
  },
  {
    id: "easypeasy",
    name: "EasyPeasy.AI",
    purpose:
      "OpenAI-compatible AI gateway — gemini-3-flash and more for Orbit SEO copy without OpenAI billing",
    priceLabel: "Credits · from easy-peasy.ai",
    payUrl: "https://easy-peasy.ai/pricing",
    docsUrl: "https://docs.easy-peasy.ai/api-reference/endpoint/chat-completions",
    payNote:
      "Paste API key in Launchpad EasyPeasy card — Orbit stores openaiBaseUrl=https://easy-peasy.ai/api automatically.",
    envKey: "EASYPEASY_API_KEY",
    priority: 5,
  },
  {
    id: "postiz",
    name: "Postiz (free social)",
    purpose:
      "Free open-source auto-posting — X, LinkedIn, Mastodon, Bluesky, Telegram, Threads. The $0 alternative to Ayrshare.",
    priceLabel: "Free (self-hosted)",
    payUrl: "https://github.com/gitroomhq/postiz-app",
    docsUrl: "https://docs.postiz.com/public-api",
    payNote:
      "Self-host with docker compose, connect channels, generate an API key, paste it below. No per-channel fees.",
    credentialKey: "postizApiKey",
    bestPick: true,
    priority: 1,
  },
  {
    id: "ayrshare",
    name: "Ayrshare (paid)",
    purpose: "Managed social API — LinkedIn, X, Threads, Bluesky, Reddit in one call",
    priceLabel: "$149/mo+ · no free tier",
    payUrl: "https://www.ayrshare.com/pricing/",
    docsUrl: "https://www.ayrshare.com/docs/apis/post/post",
    payNote:
      "No free tier — 28-day trial only. Prefer Postiz or n8n unless you need the managed API.",
    credentialKey: "ayrshareApiKey",
    priority: 11,
  },
  {
    id: "resend",
    name: "Resend",
    purpose: "Best developer email API for newsletter & podcast pitch automation",
    priceLabel: "Free 3,000/mo → $20/mo",
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
    priority: 12,
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
    priority: 4,
  },
  {
    id: "gemini",
    name: "Google Gemini (free AI)",
    purpose:
      "Free AI for Orbit copy — the $0 alternative to OpenAI billing. Lower marketing polish, same jobs.",
    priceLabel: "Free tier",
    payUrl: "https://aistudio.google.com/apikey",
    docsUrl: "https://ai.google.dev/gemini-api/docs",
    payNote:
      "Free AI key — no billing. Used when OpenAI is not configured, or always with ORBIT_AI_PROVIDER=gemini.",
    envKey: "GEMINI_API_KEY",
    bestPick: true,
    priority: 2,
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
