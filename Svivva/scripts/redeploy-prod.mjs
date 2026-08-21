#!/usr/bin/env node
/**
 * Redeploy Svivva to Vercel production (zzai-zzai / all-de-apps-in-one).
 *
 * Requires VERCEL_TOKEN (or `vercel login`) in the environment.
 * From Svivva/: npm run redeploy:prod
 */
import { spawnSync } from "child_process";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { vercelCanonical, vercelScopeArgs } from "./vercel-canonical.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const token = process.env.VERCEL_TOKEN?.trim();
if (!token) {
  console.error("VERCEL_TOKEN is not set.");
  console.error("  1. Create a token at https://vercel.com/account/tokens (ziontpiper@icloud.com)");
  console.error("  2. export VERCEL_TOKEN=…");
  console.error("  3. npm run redeploy:prod");
  console.error("");
  console.error("Or push to main — Vercel Git integration will redeploy automatically.");
  process.exit(1);
}

console.log(
  `Redeploying ${vercelCanonical.teamSlug}/${vercelCanonical.projectName} → ${vercelCanonical.productionDomain}…`,
);

const clear = spawnSync("node", ["scripts/clear-vercel-queue.mjs"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
if (clear.status !== 0) {
  console.warn("Queue clear skipped or partial (continuing with redeploy)…");
}

const pull = spawnSync(
  "vercel",
  ["pull", "--yes", "--environment=production", "--token", token, ...vercelScopeArgs()],
  { cwd: root, stdio: "inherit", env: process.env },
);
if (pull.status !== 0) process.exit(pull.status ?? 1);

const build = spawnSync("vercel", ["build", "--prod", "--token", token, ...vercelScopeArgs()], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
if (build.status !== 0) process.exit(build.status ?? 1);

const deploy = spawnSync(
  "vercel",
  ["deploy", "--prebuilt", "--prod", "--yes", "--token", token, ...vercelScopeArgs()],
  { cwd: root, stdio: "inherit", env: process.env },
);
process.exit(deploy.status ?? 0);
