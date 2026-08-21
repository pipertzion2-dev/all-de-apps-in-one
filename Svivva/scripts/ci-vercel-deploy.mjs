#!/usr/bin/env node
/**
 * GitHub Actions deploy helper — clears queue when possible, then deploys latest main.
 *
 * Priority:
 *  1. VERCEL_TOKEN + org/project → cancel queue + prebuilt CLI deploy
 *  2. VERCEL_DEPLOY_HOOK → POST hook (deploys latest connected branch)
 *
 * Exits 0 when credentials are missing and VERCEL_CI_DEPLOY is not "true" (skip quietly).
 */
import { spawnSync } from "child_process";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { vercelScopeArgs } from "./vercel-canonical.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const token = process.env.VERCEL_TOKEN?.trim();
const hook = process.env.VERCEL_DEPLOY_HOOK?.trim();
const requireDeploy = process.env.VERCEL_CI_DEPLOY === "true";

function fail(message) {
  console.error(message);
  process.exit(requireDeploy ? 1 : 0);
}

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    ...options,
  });
  return result.status ?? 1;
}

async function deployViaHook() {
  console.log("Triggering Vercel deploy hook…");
  const res = await fetch(hook, { method: "POST" });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Deploy hook failed (${res.status}): ${text}`);
    process.exit(1);
  }
  console.log(`Deploy hook accepted (${res.status}): ${text || "ok"}`);
}

async function deployViaCli() {
  console.log("Clearing queued / in-progress Vercel deployments…");
  const clearStatus = run("node", ["scripts/clear-vercel-queue.mjs"]);
  if (clearStatus !== 0) {
    console.warn("Queue clear skipped or partial (continuing with deploy)…");
  }

  const scope = vercelScopeArgs();
  if (
    run("vercel", ["pull", "--yes", "--environment=production", "--token", token, ...scope]) !== 0
  ) {
    process.exit(1);
  }
  if (run("vercel", ["build", "--prod", "--token", token, ...scope]) !== 0) {
    process.exit(1);
  }
  if (
    run("vercel", ["deploy", "--prebuilt", "--prod", "--yes", "--token", token, ...scope]) !== 0
  ) {
    process.exit(1);
  }
  console.log("Production deploy complete.");
}

if (!token && !hook) {
  fail(
    requireDeploy
      ? "VERCEL_CI_DEPLOY=true but no VERCEL_TOKEN or VERCEL_DEPLOY_HOOK secret is set."
      : "Skip: add VERCEL_DEPLOY_HOOK or VERCEL_TOKEN to GitHub secrets to deploy from Actions.",
  );
}

if (token) {
  if (!process.env.VERCEL_ORG_ID?.trim() || !process.env.VERCEL_PROJECT_ID?.trim()) {
    fail("VERCEL_TOKEN is set but VERCEL_ORG_ID or VERCEL_PROJECT_ID is missing.");
  }
  await deployViaCli();
} else {
  await deployViaHook();
}
