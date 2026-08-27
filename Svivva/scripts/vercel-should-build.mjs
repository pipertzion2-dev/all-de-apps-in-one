#!/usr/bin/env node
/**
 * Vercel "Ignored Build Step" — exit 0 = skip deploy, exit 1 = build.
 *
 * Skips when:
 * - this is a deprecated / wrong Vercel project (never deploy to svivva-main-app)
 * - branch is not main (no preview deploys from cursor/* or PR branches)
 * - commit message contains [skip vercel]
 * - Svivva/ has no changes vs previous commit (monorepo noise)
 */
import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const canonical = JSON.parse(readFileSync(join(__dirname, "..", "vercel-canonical.json"), "utf8"));

function envBlob() {
  return [
    process.env.VERCEL_PROJECT_NAME,
    process.env.VERCEL_PROJECT_ID,
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.cwd(),
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
}

const deprecated = canonical.deprecatedProjects?.map((p) => p.name.toLowerCase()) ?? [];
const blob = envBlob();
for (const name of deprecated) {
  if (name && blob.includes(name.toLowerCase())) {
    console.log(
      `Skip: deprecated Vercel project "${name}". Production is ${canonical.teamSlug}/${canonical.projectName} only.`,
    );
    process.exit(0);
  }
}

// If an allowlist of project IDs is configured, refuse unknown projects.
const allowedIds = canonical.allowedProjectIds;
if (Array.isArray(allowedIds) && allowedIds.length > 0) {
  const id = process.env.VERCEL_PROJECT_ID?.trim();
  if (id && !allowedIds.includes(id)) {
    console.log(
      `Skip: VERCEL_PROJECT_ID ${id} is not in allowedProjectIds. Use ${canonical.teamSlug}/${canonical.projectName}.`,
    );
    process.exit(0);
  }
}

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

try {
  execSync("git rev-parse HEAD^", { stdio: "ignore" });
} catch {
  console.log("Build: first commit or shallow clone");
  process.exit(1);
}

// When invoked from the monorepo root (legacy project root), only Svivva/ changes
// should trigger a build. Inside Root Directory = Svivva, "." is correct.
const atMonorepoRoot = existsSync(join(process.cwd(), "Svivva", "vercel-canonical.json"));
const diffPath = atMonorepoRoot ? "Svivva" : ".";

try {
  execSync(`git diff HEAD^ HEAD --quiet -- ${diffPath}`, { stdio: "ignore" });
  console.log(
    atMonorepoRoot
      ? "Skip: no file changes under Svivva/"
      : "Skip: no file changes under Svivva (Root Directory)",
  );
  process.exit(0);
} catch {
  console.log(
    `Build: Svivva changes detected on main → ${canonical.teamSlug}/${canonical.projectName}`,
  );
  process.exit(1);
}
