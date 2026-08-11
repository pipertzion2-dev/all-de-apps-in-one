/**
 * Daily SEO cron — Netlify Scheduled Function.
 * Calls the same App Router job as Vercel Cron: /api/cron/run-scheduled?job=seo
 *
 * Requires site env: CRON_SECRET, and URL or NEXT_PUBLIC_SITE_URL.
 */
const origin = () =>
  (process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.NEXT_PUBLIC_SITE_URL || "")
    .trim()
    .replace(/\/$/, "");

export default async function handler() {
  const base = origin();
  const secret = process.env.CRON_SECRET?.trim();
  if (!base || !secret) {
    return new Response(JSON.stringify({ error: "Missing URL or CRON_SECRET" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const res = await fetch(`${base}/api/cron/run-scheduled?job=seo`, {
    headers: { Authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(280_000),
  });
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" },
  });
}

export const config = {
  schedule: "0 6 * * *",
};
