#!/usr/bin/env node
/**
 * Run every marketing action the agent/CLI can trigger against production.
 * Requires ORBIT_INTERNAL_SECRET in .env.orbit (see scripts/orbit.env.example).
 *
 * Usage:
 *   node scripts/marketing-execute.mjs
 *   node scripts/marketing-execute.mjs --skip-run   # status + complete + health only
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

for (const name of [".env.orbit", ".env"]) {
  const p = resolve(root, name);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const SITE = (process.env.SVIVVA_URL || "https://svivva.com").replace(/\/$/, "");
const skipRun = process.argv.includes("--skip-run");

function runOrbit(args) {
  const r = spawnSync("node", ["scripts/orbit.mjs", ...args], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (!process.env.ORBIT_INTERNAL_SECRET?.trim()) {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║  Marketing execute — needs ORBIT_INTERNAL_SECRET               ║
╚══════════════════════════════════════════════════════════════════╝

Agent/CLI cannot run the live engine without the secret.

Finish in the browser (one click):
  → ${SITE}/dashboard/launchpad?autorun=1

Or set up CLI:
  1. cp scripts/orbit.env.example .env.orbit
  2. Paste ORBIT_INTERNAL_SECRET from Vercel → Settings → Environment Variables
  3. node scripts/marketing-execute.mjs

Manual checklist (after autopilot runs):
  → ${SITE}/dashboard/launchpad#orbit-one-click
  → https://search.google.com/search-console (submit sitemap)
  → https://www.bing.com/webmasters
`);
  process.exit(1);
}

console.log(`\n▶ Marketing execute — ${SITE}\n`);

const steps = [
  ["status", "Snapshot"],
  ["complete", "Fill content gaps toward 300 pages"],
  ...(skipRun ? [] : [["run", "Full marketing autopilot"]]),
  ["health", "Index health + re-submit stale URLs"],
  ["mini-apps", "Mini-app funnel audit"],
];

for (const [cmd, label] of steps) {
  console.log(`\n── ${label} (${cmd}) ──\n`);
  const args = cmd === "health" ? ["health", "--resubmit"] : [cmd];
  runOrbit(args);
}

console.log(`
✓ CLI marketing execute finished.

Finish manually (copy is pre-generated in Launchpad):
  → ${SITE}/dashboard/launchpad?autorun=1
  → GSC: https://search.google.com/search-console
`);
