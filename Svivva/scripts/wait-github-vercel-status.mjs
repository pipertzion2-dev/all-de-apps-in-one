#!/usr/bin/env node
/**
 * Wait for the canonical Vercel GitHub status check on the current commit.
 * Used when deploy runs via Vercel Git (no Actions secrets).
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
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
const started = Date.now();

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

console.log(`Waiting for "${required}" on ${sha.slice(0, 7)} (timeout ${timeoutMs / 1000}s)…`);

while (Date.now() - started < timeoutMs) {
  const data = await fetchStatus();
  const match = (data.statuses || []).find((s) => s.context === required);
  if (match) {
    console.log(`  ${required}: ${match.state} — ${match.description || ""}`);
    if (match.state === "success") {
      console.log("Vercel production deploy confirmed via Git integration.");
      process.exit(0);
    }
    const blocked = /blocked|paused|queued/i.test(match.description || "");
    if ((match.state === "failure" || match.state === "error") && !blocked) {
      console.error(`Vercel Git deploy failed: ${match.description || match.state}`);
      process.exit(1);
    }
    if (blocked) {
      console.log("  (Vercel label often means queued/paused — keep waiting…)");
    }
  } else {
    console.log(`  ${required}: pending (not reported yet)`);
  }
  await new Promise((r) => setTimeout(r, intervalMs));
}

console.error(`Timed out waiting for "${required}".`);
process.exit(1);
