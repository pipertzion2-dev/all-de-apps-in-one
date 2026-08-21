#!/usr/bin/env node
/**
 * GitHub Actions deploy helper.
 *
 * workflow_dispatch or push with credentials:
 *   1. VERCEL_TOKEN + org/project → clear queue + prebuilt CLI deploy
 *   2. VERCEL_DEPLOY_HOOK → POST hook
 *
 * push without credentials → wait for Vercel Git status on this commit.
 */
import { spawnSync } from "child_process";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { vercelScopeArgs } from "./vercel-canonical.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const token = process.env.VERCEL_TOKEN?.trim();
const hook = process.env.VERCEL_DEPLOY_HOOK?.trim();
const event = process.env.GITHUB_EVENT_NAME || "";
const requireDeploy = process.env.VERCEL_CI_DEPLOY === "true";
const hasCredentials = Boolean(token || hook);

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    ...options,
  });
  return result.status ?? 1;
}

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

async function deployViaHook() {
  console.log("Triggering Vercel deploy hook…");
  const res = await fetch(hook, { method: "POST" });
  const text = await res.text();
  if (!res.ok) {
    fail(`Deploy hook failed (${res.status}): ${text}`);
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
  console.log("Production deploy complete (CLI).");
}

async function waitForGitDeploy() {
  console.log("No Actions Vercel secrets — waiting for Vercel Git integration on this commit…");
  const status = run("node", ["scripts/wait-github-vercel-status.mjs"]);
  process.exit(status);
}

if (!hasCredentials) {
  if (event === "workflow_dispatch" || requireDeploy) {
    fail(
      "Deploy credentials required. Add VERCEL_DEPLOY_HOOK (easiest) or VERCEL_TOKEN + VERCEL_ORG_ID + VERCEL_PROJECT_ID to GitHub secrets.",
    );
  }
  await waitForGitDeploy();
}

if (token) {
  if (!process.env.VERCEL_ORG_ID?.trim() || !process.env.VERCEL_PROJECT_ID?.trim()) {
    fail("VERCEL_TOKEN is set but VERCEL_ORG_ID or VERCEL_PROJECT_ID is missing.");
  }
  await deployViaCli();
} else {
  await deployViaHook();
}
