/** Canonical admin link for SEO + AI wiring (share with the SEO/dev operator). */
export const ORBIT_SEO_CONNECT_PATH = "/dashboard/orbit/connect" as const;

export function orbitSeoConnectUrl(origin?: string): string {
  const base = (origin || "").replace(/\/$/, "");
  return base ? `${base}${ORBIT_SEO_CONNECT_PATH}` : ORBIT_SEO_CONNECT_PATH;
}

/** Steps an SEO operator completes on the connect desk. */
export const ORBIT_SEO_CONNECT_STEPS = [
  {
    id: "ai",
    title: "Wire a live AI model",
    detail: "Paste OpenAI (sk-…) or free Gemini — then test. Orbit uses this for SEO copy.",
  },
  {
    id: "gsc",
    title: "Connect Google Search Console",
    detail: "OAuth or service account so IndexNow + sitemap pings can request indexing.",
  },
  {
    id: "launch",
    title: "Run Orbit autopilot",
    detail: "Generate SEO pages and submit them once AI + GSC are green.",
  },
] as const;
