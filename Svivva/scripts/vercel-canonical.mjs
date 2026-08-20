/**
 * Canonical Vercel project for this monorepo (team zzai-zzai / all-de-apps-in-one).
 * Import from deploy scripts, CI, and agents — do not hardcode svivva-main-app.
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = join(__dirname, "..", "vercel-canonical.json");

/** @type {{ accountEmail: string; teamSlug: string; projectName: string; rootDirectory: string; productionDomain: string; dashboardUrl: string; deprecatedProjects: { name: string; reason: string }[]; githubStatusCheck: { required: string; ignore: string } }} */
export const vercelCanonical = JSON.parse(readFileSync(configPath, "utf8"));

/** CLI flags that pin deploy/link to the correct team + project. */
export function vercelScopeArgs() {
  return ["--scope", vercelCanonical.teamSlug, "--project", vercelCanonical.projectName];
}

export function assertNotDeprecatedProject(name) {
  const hit = vercelCanonical.deprecatedProjects.find((p) => p.name === name);
  if (hit) {
    throw new Error(
      `Wrong Vercel project "${name}". Use ${vercelCanonical.teamSlug}/${vercelCanonical.projectName} (${vercelCanonical.accountEmail}). ${hit.reason}`,
    );
  }
}
