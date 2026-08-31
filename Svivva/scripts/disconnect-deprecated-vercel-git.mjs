#!/usr/bin/env node
/**
 * Disconnect GitHub from deprecated Vercel projects (e.g. svivva-main-app).
 * Requires VERCEL_TOKEN for team zzai-zzai (ziontpiper@icloud.com).
 *
 * Usage: VERCEL_TOKEN=… node scripts/disconnect-deprecated-vercel-git.mjs
 */
import { vercelCanonical } from "./vercel-canonical.mjs";

const token = process.env.VERCEL_TOKEN?.trim();
if (!token) {
  console.error("VERCEL_TOKEN is not set.");
  process.exit(1);
}

const teamSlug = vercelCanonical.teamSlug;
const teamId = process.env.VERCEL_ORG_ID?.trim() || process.env.VERCEL_TEAM_ID?.trim();

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

async function resolveProjectId(projectName) {
  const data = await vercelFetch(`/v9/projects/${encodeURIComponent(projectName)}`);
  const id = data?.id;
  if (!id) throw new Error(`Could not resolve project id for ${projectName}`);
  return { id, link: data?.link || null, name: data?.name || projectName };
}

async function disconnectGit(projectId, projectName) {
  await vercelFetch(`/v9/projects/${encodeURIComponent(projectId)}/link`, { method: "DELETE" });
  console.log(`✓ Disconnected Git from ${teamSlug}/${projectName}`);
}

console.log(`Disconnecting deprecated Vercel projects on ${teamSlug}…`);

let any = false;
for (const deprecated of vercelCanonical.deprecatedProjects) {
  const projectName = deprecated.name;
  any = true;
  try {
    const { id, link } = await resolveProjectId(projectName);
    if (!link?.type) {
      console.log(`• ${projectName}: no Git repository linked (already disconnected)`);
      continue;
    }
    const repo = link.repo || link.repoId || "unknown repo";
    console.log(`• ${projectName}: linked to ${repo} — disconnecting…`);
    await disconnectGit(id, projectName);
  } catch (e) {
    const msg = String(e);
    if (msg.includes("404") || msg.includes("not_found")) {
      console.log(`• ${projectName}: not found under ${teamSlug} (may live on a different Vercel account)`);
      continue;
    }
    console.error(`✗ ${projectName}: ${msg}`);
    process.exitCode = 1;
  }
}

if (!any) {
  console.log("No deprecated projects listed in vercel-canonical.json.");
}
