#!/usr/bin/env node
/**
 * Vercel "Ignored Build Step" — exit 0 = skip deploy, exit 1 = build.
 *
 * Skips when:
 * - branch is not main (no preview deploys from cursor/* or PR branches)
 * - commit message contains [skip vercel]
 * - Svivva/ has no changes vs previous commit (monorepo noise)
 */
import { execSync } from "child_process";

const ref = process.env.VERCEL_GIT_COMMIT_REF || "";
if (ref && ref !== "main") {
  console.log(`Skip: branch "${ref}" is not main`);
  process.exit(0);
}

const msg = process.env.VERCEL_GIT_COMMIT_MESSAGE || "";
if (/\[skip vercel\]/i.test(msg)) {
  console.log("Skip: commit message contains [skip vercel]");
  process.exit(0);
}

const current = process.env.VERCEL_GIT_COMMIT_SHA?.trim();
const previous = process.env.VERCEL_GIT_PREVIOUS_SHA?.trim();

function diffQuiet(base, head) {
  execSync(`git diff ${base} ${head} --quiet -- .`, { stdio: "ignore" });
}

if (current && previous && previous !== current) {
  try {
    diffQuiet(previous, current);
    console.log(`Skip: no file changes under Svivva (${previous.slice(0, 7)}..${current.slice(0, 7)})`);
    process.exit(0);
  } catch {
    console.log(`Build: Svivva changes detected (${previous.slice(0, 7)}..${current.slice(0, 7)})`);
    process.exit(1);
  }
}

try {
  execSync("git rev-parse HEAD^", { stdio: "ignore" });
} catch {
  console.log("Build: first commit or shallow clone (no previous SHA)");
  process.exit(1);
}

try {
  diffQuiet("HEAD^", "HEAD");
  console.log("Skip: no file changes under Svivva (Root Directory)");
  process.exit(0);
} catch {
  console.log("Build: Svivva changes detected on main");
  process.exit(1);
}
