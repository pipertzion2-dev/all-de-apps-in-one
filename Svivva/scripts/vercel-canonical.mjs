/**
 * Canonical Vercel project for this monorepo (team zzai-zzai / all-de-apps-in-one).
 * Import from deploy scripts, CI, and agents — do not hardcode svivva-main-app.
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = join(__dirname, "..", "vercel-canonical.json");

/** @type {{ accountEmail: string; teamSlug: string; projectName: string; rootDirectory: string; productionDomain: string; dashboardUrl: string; allowedProjectIds?: string[]; deprecatedProjects: { name: string; reason: string }[]; githubStatusCheck: { required: string; ignore: string } }} */
export const vercelCanonical = JSON.parse(readFileSync(configPath, "utf8"));

/** CLI flags that pin deploy/link to the correct team + project. */
export function vercelScopeArgs() {
  return ["--scope", vercelCanonical.teamSlug, "--project", vercelCanonical.projectName];
}

export function assertNotDeprecatedProject(name) {
  if (!name) return;
  const hit = vercelCanonical.deprecatedProjects.find(
    (p) => p.name.toLowerCase() === String(name).toLowerCase(),
  );
  if (hit) {
    throw new Error(
      `Wrong Vercel project "${name}". Use ${vercelCanonical.teamSlug}/${vercelCanonical.projectName} (${vercelCanonical.accountEmail}). ${hit.reason}`,
    );
  }
}

/** True when env/cwd looks like a deprecated Vercel project (e.g. svivva-main-app). */
export function isDeprecatedVercelContext(env = process.env, cwd = process.cwd()) {
  const blob = [
    env.VERCEL_PROJECT_NAME,
    env.VERCEL_PROJECT_ID,
    env.VERCEL_URL,
    env.VERCEL_BRANCH_URL,
    env.VERCEL_PROJECT_PRODUCTION_URL,
    cwd,
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
  return (vercelCanonical.deprecatedProjects ?? []).some(
    (p) => p.name && blob.includes(p.name.toLowerCase()),
  );
}
