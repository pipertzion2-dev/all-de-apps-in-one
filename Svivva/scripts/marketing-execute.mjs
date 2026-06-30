#!/usr/bin/env node
/**
 * Run every automatable marketing action (agent / CLI).
 * Auth: ORBIT_INTERNAL_SECRET or admin passcode (see orbit-api-auth.mjs).
 *
 * Usage:
 *   node scripts/marketing-execute.mjs
 *   node scripts/marketing-execute.mjs --skip-run
 */
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureOrbitAuth, loadOrbitEnv, orbitFetch } from "./orbit-api-auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const skipRun = process.argv.includes("--skip-run");

loadOrbitEnv();
const SITE = (process.env.SVIVVA_URL || "https://svivva.com").replace(/\/$/, "");

function runOrbit(args) {
  const r = spawnSync("node", ["scripts/orbit.mjs", ...args], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

async function runDirectSteps(auth) {
  const steps = [
    ["POST", "/api/orbit/auto-complete", {}],
    ...(skipRun ? [] : [["POST", "/api/orbit/marketing-autopilot", { action: "run" }]]),
    ["POST", "/api/orbit/automate-manual", {}],
    ["POST", "/api/orbit/index-health", { resubmit: true, googleMaxBatches: 1 }],
  ];
  for (const [method, path, body] of steps) {
    console.log(`\n── ${method} ${path} ──\n`);
    const { res, json } = await orbitFetch(auth, path, { method, body, timeoutMs: 600_000 });
    if (!res.ok) {
      console.error(`HTTP ${res.status}:`, JSON.stringify(json).slice(0, 500));
      process.exit(1);
    }
    console.log((json.summary || JSON.stringify(json)).slice(0, 1200));
  }

  const gapSteps = [
    "svivva-aeo",
    "svivva-integrations",
    "svivva-usecases",
    "svivva-templates",
    "svivva-paa",
  ];
  for (const stepId of gapSteps) {
    console.log(`\n── run-step ${stepId} ──\n`);
    const { res, json } = await orbitFetch(auth, "/api/orbit/run-step", {
      method: "POST",
      body: { stepId },
      timeoutMs: 300_000,
    });
    if (!res.ok) console.warn(`  warn: ${stepId} → ${res.status}`);
    else console.log((json.summary || "").slice(0, 400));
  }
}

async function main() {
  console.log(`\n▶ Marketing execute — ${SITE}\n`);
  let auth;
  try {
    auth = await ensureOrbitAuth(SITE);
    console.log(`Auth: ${auth.mode}\n`);
  } catch (e) {
    console.error(String(e));
    console.log(`
Finish in browser: ${SITE}/dashboard/launchpad?autorun=1
`);
    process.exit(1);
  }

  await runDirectSteps(auth);

  const steps = [
    ["status", "Final snapshot"],
    ["health", "Index health"],
    ["mini-apps", "Mini-app audit"],
  ];
  for (const [cmd, label] of steps) {
    console.log(`\n── ${label} (${cmd}) ──\n`);
    const args = cmd === "health" ? ["health", "--resubmit"] : [cmd];
    runOrbit(args);
  }

  const { json: status } = await orbitFetch(auth, "/api/orbit/status");
  console.log(`
✓ Agent marketing execute finished.
  Pages: ${status.totalPages}/${status.targetPages} (${status.pagesPercent}%)
  IndexNow: ${status.indexNowSubmitted ? "yes" : "no"}
  Orbit steps: ${Object.values(status.stepCompletion || {}).filter(Boolean).length} complete

Manual (needs your accounts / API keys):
  → ${SITE}/dashboard/launchpad#orbit-one-click
`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
