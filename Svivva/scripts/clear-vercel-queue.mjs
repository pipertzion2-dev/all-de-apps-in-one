#!/usr/bin/env node
/**
 * Cancel queued/in-progress Vercel deployments for zzai-zzai / all-de-apps-in-one.
 * Requires VERCEL_TOKEN. Optional: VERCEL_ORG_ID (team id), VERCEL_PROJECT_ID.
 */
import { vercelCanonical } from "./vercel-canonical.mjs";

const token = process.env.VERCEL_TOKEN?.trim();
if (!token) {
  console.error("VERCEL_TOKEN is not set.");
  process.exit(1);
}

const teamSlug = vercelCanonical.teamSlug;
const projectName = vercelCanonical.projectName;
const teamId = process.env.VERCEL_ORG_ID?.trim() || process.env.VERCEL_TEAM_ID?.trim();
const projectIdEnv = process.env.VERCEL_PROJECT_ID?.trim();

const CANCELABLE = new Set(["QUEUED", "BUILDING", "INITIALIZING"]);

async function vercelFetch(path, init = {}) {
  const url = new URL(`https://api.vercel.com${path}`);
  if (teamId) url.searchParams.set("teamId", teamId);
  else url.searchParams.set("slug", teamSlug);

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

async function resolveProjectId() {
  if (projectIdEnv) return projectIdEnv;
  const data = await vercelFetch(`/v9/projects/${encodeURIComponent(projectName)}`);
  const id = data?.id;
  if (!id) throw new Error(`Could not resolve project id for ${projectName}`);
  return id;
}

async function listDeployments(projectId) {
  const data = await vercelFetch(
    `/v6/deployments?projectId=${encodeURIComponent(projectId)}&limit=30`,
  );
  return data?.deployments || [];
}

async function cancelDeployment(id) {
  try {
    await vercelFetch(`/v12/deployments/${encodeURIComponent(id)}/cancel`, { method: "PATCH" });
    return true;
  } catch (e) {
    const msg = String(e);
    if (msg.includes("400") || msg.includes("no longer cancelable")) {
      return false;
    }
    throw e;
  }
}

console.log(`Clearing queue for ${teamSlug}/${projectName}…`);

const projectId = await resolveProjectId();
const deployments = await listDeployments(projectId);
const pending = deployments.filter((d) => CANCELABLE.has(String(d.readyState || d.state || "").toUpperCase()));

if (pending.length === 0) {
  console.log("No queued or building deployments found.");
  process.exit(0);
}

console.log(`Found ${pending.length} deployment(s) to cancel:`);
for (const d of pending) {
  const state = d.readyState || d.state;
  const sha = d.meta?.githubCommitSha?.slice(0, 7) || d.meta?.gitlabCommitSha?.slice(0, 7) || "—";
  console.log(`  • ${d.url || d.id} [${state}] commit=${sha}`);
}

let canceled = 0;
for (const d of pending) {
  const ok = await cancelDeployment(d.uid || d.id);
  if (ok) {
    canceled++;
    console.log(`  ✓ canceled ${d.url || d.id}`);
  }
}

console.log(`Canceled ${canceled}/${pending.length} deployment(s).`);
