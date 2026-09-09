/**
 * Shared Vercel REST helpers for deploy scripts (team zzai-zzai).
 */
import { vercelCanonical } from "./vercel-canonical.mjs";

export function requireVercelToken() {
  const token = process.env.VERCEL_TOKEN?.trim();
  if (!token) {
    throw new Error("VERCEL_TOKEN is not set.");
  }
  return token;
}

export function teamQuery() {
  const teamId =
    process.env.VERCEL_ORG_ID?.trim() ||
    process.env.VERCEL_TEAM_ID?.trim() ||
    vercelCanonical.teamId?.trim();
  if (teamId) return { teamId };
  return { slug: vercelCanonical.teamSlug };
}

export async function vercelFetch(path, init = {}) {
  const token = requireVercelToken();
  const url = new URL(`https://api.vercel.com${path}`);
  const q = teamQuery();
  if (q.teamId) url.searchParams.set("teamId", q.teamId);
  else url.searchParams.set("slug", q.slug);

  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(typeof body === "object" ? JSON.stringify(body) : String(body));
  }
  return body;
}

export async function resolveProjectId() {
  const fromEnv = process.env.VERCEL_PROJECT_ID?.trim() || vercelCanonical.projectId?.trim();
  if (fromEnv) return fromEnv;
  const data = await vercelFetch(`/v9/projects/${encodeURIComponent(vercelCanonical.projectName)}`);
  const id = data?.id;
  if (!id) throw new Error(`Could not resolve project id for ${vercelCanonical.projectName}`);
  return id;
}
