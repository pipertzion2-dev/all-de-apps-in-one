#!/usr/bin/env node
/**
 * Warn (production) or fail (strict) when critical deploy secrets are missing on Vercel.
 */
const isProd =
  process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
const strict = process.env.SECURE_DEPLOY_STRICT === "1";

const required = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "ADMIN_USER_ID",
  "ORBIT_INTERNAL_SECRET",
  "CRON_SECRET",
  "NEXT_PUBLIC_SITE_URL",
];

const missing = required.filter((key) => !process.env[key]?.trim());

if (!isProd) {
  if (missing.length) {
    console.log("ℹ Dev build — optional secrets not set:", missing.join(", "));
  }
  process.exit(0);
}

if (missing.length === 0) {
  console.log("✓ Production security env check passed");
  process.exit(0);
}

const msg = `⚠ Production deploy missing security env: ${missing.join(", ")}`;
console.error(msg);
console.error("  Set in Vercel → Settings → Environment Variables (Production).");
console.error("  Run: npm run secrets:for-deploy");

if (strict) {
  process.exit(1);
}

process.exit(0);
