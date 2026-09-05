#!/usr/bin/env node
/**
 * Fail Vercel builds from the wrong project or repo root.
 *
 * Production must deploy only from:
 *   team zzai-zzai / project all-de-apps-in-one / Root Directory Svivva
 *
 * The deprecated svivva-main-app project often connects at repo root and reverts production.
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

/** @type {{ accountEmail: string; teamSlug: string; projectName: string; rootDirectory: string; deprecatedProjects: { name: string; reason: string }[] }} */
const canonical = JSON.parse(
  readFileSync(join(repoRoot, "Svivva/vercel-canonical.json"), "utf8"),
);

const deprecatedNames = new Set(canonical.deprecatedProjects.map((p) => p.name));
const dashboard = canonical.dashboardUrl;

function fail(message) {
  console.error("\n✖ Vercel deploy blocked\n");
  console.error(message);
  console.error(`\nCorrect production project: ${canonical.teamSlug}/${canonical.projectName}`);
  console.error(`Account: ${canonical.accountEmail}`);
  console.error(`Root Directory: ${canonical.rootDirectory}`);
  console.error(`Dashboard: ${dashboard}`);
  console.error("\nDisconnect the wrong project: docs/VERCEL_ACCOUNT.md");
  console.error("  svivva-main-app → Settings → Git → Disconnect this repository\n");
  process.exit(1);
}

if (process.env.VERCEL !== "1") {
  process.exit(0);
}

const projectName = (process.env.VERCEL_PROJECT_NAME || "").trim();

if (deprecatedNames.has(projectName)) {
  const reason =
    canonical.deprecatedProjects.find((p) => p.name === projectName)?.reason ||
    "Deprecated Vercel project.";
  fail(
    `Project "${projectName}" must not deploy this repo.\n${reason}\n\nRemove its GitHub connection so pushes stop triggering it.`,
  );
}

/** When invoked from repo-root vercel-build — correct project uses Root Directory Svivva instead. */
if (process.env.ASSERT_VERCEL_ROOT === "1") {
  fail(
    `Repo-root deploy is not allowed on Vercel (project: ${projectName || "unknown"}).\n` +
      `Set Root Directory to "${canonical.rootDirectory}" on ${canonical.projectName}, ` +
      `then disconnect svivva-main-app from GitHub.`,
  );
}

/** Defense in depth when Svivva/ is the root directory but project name is wrong. */
if (projectName && projectName !== canonical.projectName) {
  fail(
    `Wrong Vercel project "${projectName}". Expected "${canonical.projectName}" on team ${canonical.teamSlug}.`,
  );
}

console.log(`✓ Vercel project OK: ${canonical.teamSlug}/${projectName || canonical.projectName}`);
