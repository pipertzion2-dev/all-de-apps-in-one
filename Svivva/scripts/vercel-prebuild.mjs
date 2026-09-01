/**
 * Runs before Vercel `build:vercel` — ensures DB tables exist when DATABASE_URL is set.
 * Failures are logged but do not block deploy (inline Play path works without DB).
 */
import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

/** Neon DDL must use direct URL — pooler cannot CREATE TABLE reliably. */
function getDatabaseMigrationUrl() {
  const unpooled =
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    process.env.POSTGRES_URL?.trim();
  if (unpooled) return unpooled;
  const pooled = process.env.DATABASE_URL?.trim();
  if (!pooled) return null;
  if (pooled.includes("-pooler.")) return pooled.replace("-pooler.", ".");
  return pooled;
}

function runNodeScript(relPath, label) {
  console.log(`\n→ ${label}`);
  execSync(`node "${resolve(root, relPath)}"`, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
}

const migrationUrl = getDatabaseMigrationUrl();
if (!migrationUrl) {
  console.warn("⚠ DATABASE_URL not set — skipping DB migrations on Vercel build");
} else {
  try {
    console.log("\n→ Pushing full Drizzle schema (direct/unpooled Neon URL)…");
    execSync("npx drizzle-kit push --force", {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: migrationUrl },
    });
  } catch (err) {
    console.warn("⚠ drizzle-kit push failed (continuing build):", err?.message ?? err);
  }
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
