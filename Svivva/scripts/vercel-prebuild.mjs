/**
 * Runs before Vercel `build:vercel` — ensures DB tables exist when DATABASE_URL is set.
 * Failures are logged but do not block deploy (inline Play path works without DB).
 */
import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { assertNotDeprecatedProject, vercelCanonical } from "./vercel-canonical.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

/** Hard stop if a deprecated Vercel project somehow reaches the build step. */
function assertCanonicalDeployTarget() {
  const name = process.env.VERCEL_PROJECT_NAME?.trim();
  if (name) assertNotDeprecatedProject(name);

  const blob = [
    process.env.VERCEL_PROJECT_NAME,
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.cwd(),
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();

  for (const p of vercelCanonical.deprecatedProjects ?? []) {
    if (p.name && blob.includes(p.name.toLowerCase())) {
      throw new Error(
        `Refusing to build on deprecated Vercel project "${p.name}". ` +
          `Use ${vercelCanonical.teamSlug}/${vercelCanonical.projectName} (${vercelCanonical.accountEmail}). ` +
          p.reason,
      );
    }
  }

  const allowedIds = vercelCanonical.allowedProjectIds;
  const id = process.env.VERCEL_PROJECT_ID?.trim();
  if (Array.isArray(allowedIds) && allowedIds.length > 0 && id && !allowedIds.includes(id)) {
    throw new Error(
      `Refusing to build: VERCEL_PROJECT_ID ${id} is not allowed. ` +
        `Canonical project is ${vercelCanonical.teamSlug}/${vercelCanonical.projectName}.`,
    );
  }

  console.log(
    `✓ Vercel build target OK (canonical: ${vercelCanonical.teamSlug}/${vercelCanonical.projectName})`,
  );
}

assertCanonicalDeployTarget();

function runNodeScript(relPath, label) {
  console.log(`\n→ ${label}`);
  execSync(`node "${resolve(root, relPath)}"`, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
}

if (!process.env.DATABASE_URL?.trim()) {
  console.warn("⚠ DATABASE_URL not set — skipping DB migrations on Vercel build");
} else {
  try {
    runNodeScript("scripts/play-db-migrate.mjs", "Ensuring Svivva Play tables…");
  } catch (err) {
    console.warn("⚠ Play table migration failed (continuing build):", err?.message ?? err);
  }
  try {
    runNodeScript("scripts/piggy-bank-db-migrate.mjs", "Ensuring admin piggy bank table…");
  } catch (err) {
    console.warn("⚠ Piggy bank migration failed (continuing build):", err?.message ?? err);
  }
}

try {
  runNodeScript("scripts/verify-production-secrets.mjs", "Verifying production security env…");
} catch (err) {
  console.warn("⚠ Production security env check failed:", err?.message ?? err);
}
