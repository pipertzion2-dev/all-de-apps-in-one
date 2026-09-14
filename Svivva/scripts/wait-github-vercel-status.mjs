#!/usr/bin/env node
/**
 * Wait for the canonical Vercel GitHub status check on the current commit.
 * Falls back to live production HTTP verification when GitHub status is stale
 * (e.g. "Account is blocked" while Vercel Git deploy actually succeeded).
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  diffRequiresProductionDeployAsync,
  listChangedFilesAsync,
  resolveDiffRangeAsync,
} from "./vercel-deploy-diff.mjs";
import { deployVerifyTargets, verifyProductionLive } from "./verify-production-live.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const canonical = JSON.parse(readFileSync(resolve(__dirname, "../vercel-canonical.json"), "utf8"));
const required = canonical.githubStatusCheck?.required || "Vercel – all-de-apps-in-one";

const repo = process.env.GITHUB_REPOSITORY;
const sha = process.env.GITHUB_SHA;
const token = process.env.GITHUB_TOKEN;

if (!repo || !sha || !token) {
  console.error("Requires GITHUB_REPOSITORY, GITHUB_SHA, and GITHUB_TOKEN.");
  process.exit(1);
}

const timeoutMs = Number(process.env.VERCEL_STATUS_TIMEOUT_MS || 20 * 60 * 1000);
const intervalMs = Number(process.env.VERCEL_STATUS_POLL_MS || 20_000);
const blockedFailFastMs = Number(process.env.VERCEL_BLOCKED_FAIL_FAST_MS || 90_000);
const started = Date.now();
let blockedSince = null;

/** @type {{ url: string; markers: string[] }[]} */
let verifyTargets = [];

async function loadVerifyTargets() {
  const fromEnvUrl = process.env.DEPLOY_VERIFY_URL?.trim();
  const fromEnvMarkers = process.env.DEPLOY_VERIFY_MARKERS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (fromEnvUrl) {
    verifyTargets = [{ url: fromEnvUrl, markers: fromEnvMarkers ?? [] }];
    return;
  }
  const { base, head } = await resolveDiffRangeAsync(repoRoot);
  const files = base && head ? await listChangedFilesAsync(base, head, repoRoot) : null;
  verifyTargets = deployVerifyTargets(files ?? [], sha);
}

async function isVercelProjectPaused() {
  try {
    const res = await fetch("https://all-de-apps-in-one.vercel.app/", {
      method: "HEAD",
      redirect: "manual",
    });
    return res.status === 402;
  } catch {
    return false;
  }
}

function describeVerifyTarget(target) {
  if (target.expectedSha) {
    return `/api/deploy-revision (${target.expectedSha.slice(0, 7)})`;
  }
  return target.url || "unknown";
}

async function tryProductionVerify(label, exitOnSuccess = true) {
  if (!verifyTargets.length) await loadVerifyTargets();
  let allOk = true;
  for (const target of verifyTargets) {
    const result = await verifyProductionLive({
      url: target.url,
      markers: target.markers,
      expectedSha: target.expectedSha,
      attempts: 2,
      delayMs: 3000,
    });
    if (result.ok) {
      const where = result.url || `revision ${result.sha}`;
      console.log(`${label} Production live at ${where}`);
      continue;
    }
    allOk = false;
    console.log(`  Production check ${describeVerifyTarget(target)}: ${result.reason}`);
  }
  if (allOk && exitOnSuccess) {
    console.log("(GitHub Vercel status may be stale — production revision confirmed.)");
    process.exit(0);
  }
  return allOk;
}

async function reportPausedProject() {
  if (!(await isVercelProjectPaused())) return false;
  console.error("");
  console.error("Vercel project is PAUSED (DEPLOYMENT_DISABLED / spend cap).");
  console.error(`  Resume: ${canonical.dashboardUrl} → Settings → Resume Service`);
  console.error("  Or add VERCEL_TOKEN to GitHub secrets and run Fix Vercel block workflow.");
  console.error(`  ${canonical.productionDomain} keeps serving the last build before the pause.`);
  return true;
}

async function fetchStatus() {
  const res = await fetch(`https://api.github.com/repos/${repo}/commits/${sha}/status`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub status API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function ignoredBuildAcceptable() {
  const { base, head, label } = await resolveDiffRangeAsync(repoRoot);
  if (!base) {
    console.log("Could not resolve parent commit for diff — treating ignored build as failure.");
    return false;
  }
  const requiresDeploy = await diffRequiresProductionDeployAsync(base, head, repoRoot);
  if (!requiresDeploy) {
    console.log(`Ignored build is OK — non-production paths only (${label}).`);
    return true;
  }
  return false;
}

await loadVerifyTargets();
console.log(`Waiting for "${required}" on ${sha.slice(0, 7)} (timeout ${timeoutMs / 1000}s)…`);
if (verifyTargets.length) {
  console.log(`Production fallback checks: ${verifyTargets.map(describeVerifyTarget).join(", ")}`);
}
if (await isVercelProjectPaused()) {
  await reportPausedProject();
}

while (Date.now() - started < timeoutMs) {
  const data = await fetchStatus();
  const match = (data.statuses || []).find((s) => s.context === required);
  if (match) {
    console.log(`  ${required}: ${match.state} — ${match.description || ""}`);
    const ignored = /ignored build step/i.test(match.description || "");
    if (match.state === "success" && ignored) {
      if (await ignoredBuildAcceptable()) {
        console.log("Vercel skipped deploy intentionally; production unchanged.");
        process.exit(0);
      }
      console.error(
        `Vercel skipped the build (${match.description}) but production paths changed — set VERCEL_TOKEN or VERCEL_DEPLOY_HOOK, or push with [deploy].`,
      );
      process.exit(1);
    }
    if (match.state === "success") {
      console.log("Vercel Git reported success — confirming production revision…");
      if (await tryProductionVerify("✓", true)) {
        process.exit(0);
      }
      await reportPausedProject();
      console.error(
        "GitHub shows deploy success but production is still on an older revision — waiting…",
      );
    }
    const blocked = /blocked|paused|queued/i.test(match.description || "");
    if ((match.state === "failure" || match.state === "error") && !blocked) {
      console.error(`Vercel Git deploy failed: ${match.description || match.state}`);
      process.exit(1);
    }
    if (blocked) {
      if (blockedSince === null) blockedSince = Date.now();
      const blockedFor = Date.now() - blockedSince;
      if (blockedFor >= 30_000) {
        console.log("  GitHub reports blocked/queued — checking live production…");
        await tryProductionVerify("✓");
      }
      if (blockedFor >= blockedFailFastMs) {
        console.error("");
        console.error(
          `GitHub Vercel status still "${match.description}" after ${Math.round(blockedFor / 1000)}s.`,
        );
        console.log("Final production verification attempt…");
        await tryProductionVerify("✓");
        await reportPausedProject();
        console.error("Production verification failed — deploy not confirmed live.");
        console.error(`  Dashboard: ${canonical.dashboardUrl}`);
        console.error(
          "  Optional: add VERCEL_TOKEN or VERCEL_DEPLOY_HOOK to GitHub secrets for CLI deploy.",
        );
        process.exit(1);
      }
      console.log("  (Stale blocked label is common — waiting / verifying production…)");
    } else {
      blockedSince = null;
    }
  } else {
    console.log(`  ${required}: pending (not reported yet)`);
  }
  await new Promise((r) => setTimeout(r, intervalMs));
}

console.log("Timed out on GitHub status — last production verification attempt…");
await tryProductionVerify("✓");
console.error(`Timed out waiting for "${required}".`);
process.exit(1);
