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
  /** How this unlocks Orbit completion */
  tier: "ai" | "free_publish" | "paid_publish";
};

export const ORBIT_SETUP_PROVIDERS: OrbitSetupProvider[] = [
  {
    id: "gemini",
    name: "Google Gemini (free)",
    purpose: "Free AI for launch copy, articles, pitches, and directory listings",
    priceLabel: "Free tier",
    payUrl: "https://aistudio.google.com/apikey",
    docsUrl: "https://ai.google.dev/gemini-api/docs",
    payNote: "No card required. Add GEMINI_API_KEY in Vercel env — Orbit uses it automatically.",
    envKey: "GEMINI_API_KEY",
    priority: 1,
    tier: "ai",
  },
  {
    id: "devto",
    name: "Dev.to",
    purpose: "Free API — Orbit auto-publishes your launch article",
    priceLabel: "Free",
    payUrl: "https://dev.to/settings/extensions",
    docsUrl: "https://developers.forem.com/api",
    payNote: "Generate an API key → paste below. No card.",
    credentialKey: "devtoApiKey",
    priority: 2,
    tier: "free_publish",
  },
  {
    id: "hashnode",
    name: "Hashnode",
    purpose: "Free API — auto-publish blog (needs API key + publication ID)",
    priceLabel: "Free",
    payUrl: "https://hashnode.com/settings/developer",
    docsUrl: "https://apidocs.hashnode.com",
    payNote: "Create a Personal Access Token, then paste key + publication ID below.",
    credentialKey: "hashnodeApiKey",
    priority: 3,
    tier: "free_publish",
  },
  {
    id: "reddit",
    name: "Reddit app",
    purpose: "Free OAuth app — auto-post to r/SideProject when configured",
    priceLabel: "Free",
    payUrl: "https://www.reddit.com/prefs/apps",
    docsUrl: "https://www.reddit.com/prefs/apps",
    payNote: "Create a script app → paste client ID (and secret/refresh via Advanced credentials).",
    credentialKey: "redditClientId",
    priority: 4,
    tier: "free_publish",
  },
  {
    id: "openai",
    name: "OpenAI (optional)",
    purpose: "Paid AI fallback if Gemini is unavailable",
    priceLabel: "~$5–20 prepaid credits",
    payUrl: "https://platform.openai.com/settings/organization/billing/overview",
    docsUrl: "https://platform.openai.com/api-keys",
    payNote: "Add payment in Safari — Apple Pay accepted. Then create an API key.",
    envKey: "OPENAI_API_KEY",
    priority: 5,
    tier: "ai",
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
    priority: 6,
    tier: "paid_publish",
  },
  {
    id: "resend",
    name: "Resend",
    purpose: "Auto-send newsletter & podcast pitch emails",
    priceLabel: "Free tier → $20/mo",
    payUrl: "https://resend.com/signup",
    docsUrl: "https://resend.com/docs/api-reference/emails/send-email",
    payNote: "Sign up in Safari — Apple Pay on paid plans. Paste API key + from/to emails below.",
    credentialKey: "resendApiKey",
    priority: 7,
    tier: "paid_publish",
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
    "Add Resend key (or copy pitch)",
    "Open your email client",
    "Paste pitch & send",
    "Tap Done",
  ],
  "dir-futurepedia": ["Copy listing", "Open directory", "Paste fields", "Submit", "Tap Done"],
  "dir-taaft": ["Copy listing", "Open TAAFT", "Paste fields", "Submit", "Tap Done"],
  "dir-g2": ["Copy listing", "Open G2", "Paste fields", "Submit", "Tap Done"],
};

export function stepsForTask(taskId: string): string[] {
  return MANUAL_TASK_STEPS[taskId] ?? MANUAL_TASK_STEPS.default;
}
