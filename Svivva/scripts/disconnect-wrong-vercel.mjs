#!/usr/bin/env node
/**
 * Print steps to disconnect svivva-main-app and optionally verify via Vercel API.
 *
 * Usage:
 *   node scripts/disconnect-wrong-vercel.mjs
 *   VERCEL_TOKEN=… node scripts/disconnect-wrong-vercel.mjs --check
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const canonical = JSON.parse(readFileSync(join(__dirname, "..", "vercel-canonical.json"), "utf8"));

const REPO = "pipertzion2-dev/all-de-apps-in-one";
const check = process.argv.includes("--check");

console.log(`
Disconnect wrong Vercel project (stops deploy reverts)
======================================================

KEEP (production):
  Account:  ${canonical.accountEmail}
  Team:     ${canonical.teamSlug}
  Project:  ${canonical.projectName}
  Root dir: ${canonical.rootDirectory}
  URL:      ${canonical.dashboardUrl}

REMOVE (deprecated):
${canonical.deprecatedProjects.map((p) => `  • ${p.name} — ${p.reason}`).join("\n")}

--- Step 1: Wrong Vercel account (owns svivva-main-app) ---
1. Sign in to vercel.com with the account that owns svivva-main-app
   (NOT ${canonical.accountEmail} if that is a separate login).
2. Open project svivva-main-app → Settings → Git.
3. Disconnect repository ${REPO}.
4. Optional: delete or pause the project.

--- Step 2: GitHub ---
1. github.com → ${REPO} → Settings → Integrations → Applications → Vercel → Configure.
2. Ensure only ${canonical.teamSlug} / ${canonical.projectName} is linked.
3. Remove the old team/project if listed.

--- Step 3: Confirm correct project (${canonical.accountEmail}) ---
1. ${canonical.dashboardUrl} → Settings → Git
   • Repo: ${REPO}
   • Root Directory: ${canonical.rootDirectory}
2. Settings → Domains → zzaizzai.com + www.zzaizzai.com

After disconnect, GitHub should show only:
  ✓ Vercel – all-de-apps-in-one
  ✗ Vercel – svivva-main-app (gone)

Repo builds from svivva-main-app now fail automatically (scripts/assert-vercel-project.mjs).
`);

async function checkProjects() {
  const token = process.env.VERCEL_TOKEN?.trim();
  if (!token) {
    console.log("Tip: VERCEL_TOKEN=… node scripts/disconnect-wrong-vercel.mjs --check");
    return;
  }

  const team = canonical.teamSlug;
  const headers = { Authorization: `Bearer ${token}` };

  for (const name of [canonical.projectName, ...canonical.deprecatedProjects.map((p) => p.name)]) {
    try {
      const res = await fetch(
        `https://api.vercel.com/v9/projects/${encodeURIComponent(name)}?teamId=${team}`,
        { headers, signal: AbortSignal.timeout(15_000) },
      );
      if (res.status === 404) {
        console.log(`  ${name}: not found on team ${team} (good if deprecated)`);
        continue;
      }
      if (!res.ok) {
        console.log(`  ${name}: HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const link = data.link;
      const repo = link?.type === "github" ? link.repo : link?.repoId ?? "not linked";
      console.log(`  ${name}: linked → ${repo}`);
    } catch (e) {
      console.log(`  ${name}: check failed — ${e?.message ?? e}`);
    }
  }
}

if (check) {
  console.log("Checking Vercel project links (requires token on team zzai-zzai)…\n");
  await checkProjects();
}
