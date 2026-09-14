#!/usr/bin/env node
/**
 * Vercel "Ignored Build Step" — exit 0 = skip deploy, exit 1 = build.
 *
 * On main: always build unless [skip vercel]. Diff-based skips caused missed
 * production deploys when Vercel shallow clones omitted parent SHAs.
 *
 * On other branches: skip (no preview deploys from cursor/* or PR branches).
 */
import { execSync } from "child_process";

function resolveCommitMessage() {
  const fromEnv = process.env.VERCEL_GIT_COMMIT_MESSAGE?.trim() || "";
  if (fromEnv) return fromEnv;
  try {
    return execSync("git log -1 --format=%B", { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const ref = process.env.VERCEL_GIT_COMMIT_REF || "";
const msg = resolveCommitMessage();

if (ref && ref !== "main") {
  console.log(`Skip: branch "${ref}" is not main`);
  process.exit(0);
}

if (/\[skip vercel\]/i.test(msg)) {
  console.log("Skip: commit message contains [skip vercel]");
  process.exit(0);
}

console.log("Build: main branch (deploy all commits unless [skip vercel])");
process.exit(1);
