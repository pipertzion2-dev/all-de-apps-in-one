#!/usr/bin/env node
/**
 * Vercel "Ignored Build Step" — exit 0 = skip deploy, exit 1 = build.
 *
 * Skips when:
 * - branch is not main (no preview deploys from cursor/* or PR branches)
 * - commit message contains [skip vercel]
 * - diff only touches non-production paths (scripts/, tests, docs, workflows)
 * - Svivva/ has no changes vs previous commit (monorepo noise)
 */
import { diffRequiresProductionDeploy, resolveDiffRange } from "./vercel-deploy-diff.mjs";

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
if (/\[(vercel )?deploy\]/i.test(msg)) {
  console.log("Build: commit message requests deploy");
  process.exit(1);
}

const { base, head, label } = resolveDiffRange(".");

if (!base) {
  console.log("Build: first commit or shallow clone (no previous SHA)");
  process.exit(1);
}

if (!diffRequiresProductionDeploy(base, head, ".")) {
  console.log(`Skip: non-production paths only (${label})`);
  process.exit(0);
}

console.log(`Build: production paths changed (${label})`);
process.exit(1);
