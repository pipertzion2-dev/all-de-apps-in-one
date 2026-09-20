#!/usr/bin/env node
/**
 * Delete old Vercel deployments to reclaim Deployment Storage / Functions Storage.
 * Keeps the latest production deployment and the N most recent successful ones.
 *
 * Requires VERCEL_TOKEN. Optional: VERCEL_ORG_ID, VERCEL_PROJECT_ID,
 * KEEP_DEPLOYMENTS (default 8), DRY_RUN=1.
 *
 * Usage:
 *   DRY_RUN=1 node scripts/prune-old-deployments.mjs
 *   node scripts/prune-old-deployments.mjs
 */
import { resolveProjectId, vercelFetch } from "./vercel-api.mjs";
import { vercelCanonical } from "./vercel-canonical.mjs";

const KEEP = Math.max(2, Number(process.env.KEEP_DEPLOYMENTS || 8));
const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

async function listAllDeployments(projectId) {
  const out = [];
  let until;
  for (let page = 0; page < 40; page++) {
    const qs = new URLSearchParams({
      projectId,
      limit: "100",
    });
    if (until) qs.set("until", String(until));
    const data = await vercelFetch(`/v6/deployments?${qs}`);
    const batch = data?.deployments || [];
    if (batch.length === 0) break;
    out.push(...batch);
    const last = batch[batch.length - 1];
    until = last.createdAt ?? last.created;
    if (batch.length < 100) break;
  }
  return out;
}

async function deleteDeployment(id) {
  await vercelFetch(`/v13/deployments/${encodeURIComponent(id)}`, { method: "DELETE" });
}

const projectId = await resolveProjectId();
console.log(
  `${DRY_RUN ? "[dry-run] " : ""}Pruning deployments for ${vercelCanonical.teamSlug}/${vercelCanonical.projectName} (keep ${KEEP})…`,
);

const deployments = await listAllDeployments(projectId);
console.log(`Found ${deployments.length} deployment(s).`);

const sorted = [...deployments].sort((a, b) => {
  const ta = Number(a.createdAt ?? a.created ?? 0);
  const tb = Number(b.createdAt ?? b.created ?? 0);
  return tb - ta;
});

const keepIds = new Set();
for (const d of sorted) {
  const target = String(d.target || "").toLowerCase();
  const state = String(d.readyState || d.state || "").toUpperCase();
  if (target === "production" && state === "READY" && keepIds.size === 0) {
    keepIds.add(d.uid || d.id);
  }
}

for (const d of sorted) {
  if (keepIds.size >= KEEP) break;
  const id = d.uid || d.id;
  if (!id || keepIds.has(id)) continue;
  const state = String(d.readyState || d.state || "").toUpperCase();
  if (state === "READY" || state === "ERROR" || state === "CANCELED") {
    keepIds.add(id);
  }
}

const toDelete = sorted.filter((d) => !keepIds.has(d.uid || d.id));
console.log(`Keeping ${keepIds.size}, deleting ${toDelete.length}.`);

let deleted = 0;
for (const d of toDelete) {
  const id = d.uid || d.id;
  const state = d.readyState || d.state;
  const url = d.url || id;
  if (DRY_RUN) {
    console.log(`  • would delete ${url} [${state}]`);
    continue;
  }
  try {
    await deleteDeployment(id);
    deleted++;
    console.log(`  ✓ deleted ${url} [${state}]`);
  } catch (e) {
    console.warn(`  ✗ skip ${url}: ${e.message || e}`);
  }
}

console.log(DRY_RUN ? "Dry run complete." : `Deleted ${deleted} deployment(s).`);
