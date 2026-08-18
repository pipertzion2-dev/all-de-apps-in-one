/** Copy for Orbit admin — connect your own LLM for marketing autopilot. */

export const ORBIT_AI_SETUP_HEADLINE = "Connect your LLM first (required for AI-written marketing)";

export const ORBIT_AI_SETUP_STEPS = [
  {
    title: "Add billing + create an API key",
    body: "OpenAI (recommended): add prepaid credits, then create an sk- key at platform.openai.com/api-keys. Any OpenAI-compatible gateway works too.",
    links: [
      {
        label: "OpenAI billing",
        href: "https://platform.openai.com/settings/organization/billing/overview",
      },
      { label: "Create API key", href: "https://platform.openai.com/api-keys" },
    ],
  },
  {
    title: "Paste the key in this app (server-side only)",
    body: "Dashboard → Platform Secrets → OpenAI API key. Or add OPENAI_API_KEY in Vercel → Environment Variables. Keys never ship to the browser.",
    links: [{ label: "Open Platform Secrets", href: "/dashboard/settings/runtime-keys" }],
  },
  {
    title: "Optional: pick your model & custom LLM base URL",
    body: "In Vercel/host env set ORBIT_AI_MODEL (e.g. gpt-4o-mini or gpt-4o). For a custom gateway, also set AI_INTEGRATIONS_OPENAI_BASE_URL to your provider’s OpenAI-compatible endpoint.",
  },
  {
    title: "Redeploy, then confirm the green check",
    body: "After deploy, refresh Launchpad. “Marketing AI” should show ready with OpenAI (paid) or your gateway. If not, set ORBIT_AI_PROVIDER=openai and redeploy once.",
  },
  {
    title: "Press Run all AI marketing",
    body: "Orbit uses your LLM for SEO pages, blog posts, social packs, and outreach. Distribution (LinkedIn/X/email) still uses OmniSocials + Resend keys below when you add them.",
  },
] as const;

export const ORBIT_AI_SETUP_FOOTNOTE =
  "Orbit prefers your paid OpenAI key when present. Gemini is only a free fallback if no OpenAI key is set.";
