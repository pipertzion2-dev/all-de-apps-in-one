/**
 * Runs before Vercel `build:vercel` — ensures DB tables exist when DATABASE_URL is set.
 * Failures are logged but do not block deploy (inline Play path works without DB).
 */
import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

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
}

try {
  runNodeScript("scripts/verify-production-secrets.mjs", "Verifying production security env…");
} catch (err) {
  console.warn("⚠ Production security env check failed:", err?.message ?? err);
}
