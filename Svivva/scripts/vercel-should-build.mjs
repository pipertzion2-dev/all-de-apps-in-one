#!/usr/bin/env node
/**
 * Vercel "Ignored Build Step" — exit 0 = skip deploy, exit 1 = build.
 *
 * On main: build unless [skip vercel] or diff is docs/scripts-only (non-empty).
 * Empty diffs on main always build (Vercel shallow clones often miss parent SHAs).
 *
 * On other branches: skip (no preview deploys from cursor/* or PR branches).
 */
import { execSync } from "child_process";
import {
  diffRequiresProductionDeploy,
  listChangedFiles,
  resolveDiffRange,
} from "./vercel-deploy-diff.mjs";

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

if (/\[(vercel )?deploy\]/i.test(msg)) {
  console.log("Build: commit message requests deploy");
  process.exit(1);
}

const { base, head, label } = resolveDiffRange(".");

if (!base) {
  console.log("Build: first commit or shallow clone (no previous SHA)");
  process.exit(1);
}

const files = listChangedFiles(base, head, ".");
if (!files?.length) {
  console.log(`Build: empty diff on main (${label}) — forcing deploy`);
  process.exit(1);
}

if (!diffRequiresProductionDeploy(base, head, ".")) {
  console.log(`Skip: non-production paths only (${label})`);
  process.exit(0);
}

console.log(`Build: production paths changed (${label})`);
process.exit(1);
