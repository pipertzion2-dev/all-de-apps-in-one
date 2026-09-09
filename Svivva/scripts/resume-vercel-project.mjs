#!/usr/bin/env node
/**
 * Unpause / resume the canonical Vercel project when deployments show
 * "Account is blocked" (usually spend-cap pause, not a banned account).
 *
 * Usage: VERCEL_TOKEN=… npm run vercel:resume
 */
import { vercelCanonical } from "./vercel-canonical.mjs";
import { resolveProjectId, vercelFetch } from "./vercel-api.mjs";

console.log(
  `Resuming ${vercelCanonical.teamSlug}/${vercelCanonical.projectName} (${vercelCanonical.productionDomain})…`,
);

const projectId = await resolveProjectId();

try {
  await vercelFetch(`/v1/projects/${encodeURIComponent(projectId)}/unpause`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  console.log("✓ Project unpaused — production should resume within a few minutes.");
} catch (e) {
  const msg = String(e);
  if (msg.includes("410") || /already.*unpaused|not paused/i.test(msg)) {
    console.log("• Project is not paused (already running).");
    process.exit(0);
  }
  console.error(`✗ Unpause failed: ${msg}`);
  console.error("");
  console.error("Manual fix:");
  console.error(`  1. Sign in as ${vercelCanonical.accountEmail}`);
  console.error(`  2. Open ${vercelCanonical.dashboardUrl}`);
  console.error("  3. Settings → Resume Service (or raise Spend Management limit)");
  process.exit(1);
}
