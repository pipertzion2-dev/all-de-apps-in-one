#!/usr/bin/env node
/**
 * Set production DATABASE_URL on Vercel (zzai-zzai / all-de-apps-in-one).
 *
 * Usage:
 *   VERCEL_TOKEN=... node scripts/set-vercel-database-url.mjs "postgresql://..."
 *   # or pipe:
 *   echo "$DATABASE_URL" | node scripts/set-vercel-database-url.mjs
 *
 * Get a free Neon URL: https://neon.tech → New Project → Connection string.
 */
import { execSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const SCOPE = ["--scope", "zzai-zzai", "--project", "all-de-apps-in-one"];
const token = process.env.VERCEL_TOKEN?.trim();

let url = process.argv[2]?.trim();
if (!url && !process.stdin.isTTY) {
  url = readFileSync(0, "utf8").trim();
}

if (!url) {
  console.error(
    'Usage: VERCEL_TOKEN=... node scripts/set-vercel-database-url.mjs "postgresql://USER:PASS@HOST/DB?sslmode=require"',
  );
  process.exit(1);
}

if (/127\.0\.0\.1|localhost/i.test(url)) {
  console.error("Refusing localhost DATABASE_URL for Vercel production.");
  process.exit(1);
}

if (!token) {
  console.error("VERCEL_TOKEN is required (from ziontpiper@icloud.com → Account → Tokens).");
  process.exit(1);
}

const env = { ...process.env, VERCEL_TOKEN: token };

console.log("Setting DATABASE_URL on Vercel production (all-de-apps-in-one)…");
execSync(`vercel env rm DATABASE_URL production -y ${SCOPE.join(" ")}`, { stdio: "inherit", env });
const add = spawnSync("vercel", ["env", "add", "DATABASE_URL", "production", ...SCOPE], {
  input: url,
  stdio: ["pipe", "inherit", "inherit"],
  env,
});
if (add.status !== 0) process.exit(add.status ?? 1);
console.log("✓ DATABASE_URL set. Redeploy production for Orbit to connect.");
