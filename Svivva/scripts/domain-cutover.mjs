#!/usr/bin/env node
/**
 * Point GoDaddy domain at Vercel via live Orbit API.
 *
 *   node scripts/domain-cutover.mjs
 *   node scripts/domain-cutover.mjs --domain zzaizzai.com
 *   SVIVVA_URL=https://svivva.com node scripts/domain-cutover.mjs
 */
import { ensureOrbitAuth, loadOrbitEnv, orbitFetch } from "./orbit-api-auth.mjs";

loadOrbitEnv();
const SITE = (process.env.SVIVVA_URL || "https://svivva.com").replace(/\/$/, "");

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

async function main() {
  const domain = arg("--domain", process.env.CUTOVER_DOMAIN || "zzaizzai.com");
  const skipVercel = process.argv.includes("--skip-vercel");
  console.log(`\n▶ Domain cutover — ${domain} via ${SITE}\n`);

  const auth = await ensureOrbitAuth(SITE);
  console.log(`Auth: ${auth.mode}\n`);

  const { res, json } = await orbitFetch(auth, "/api/orbit/domain-cutover", {
    method: "POST",
    body: { domain, skipVercel },
    timeoutMs: 90_000,
  });

  console.log(json.summary || JSON.stringify(json, null, 2));
  if (json.nextSteps?.length) {
    console.log("\nNext steps:");
    for (const s of json.nextSteps) console.log(`  · ${s}`);
  }
  if (!res.ok || !json.ok) process.exit(1);
  console.log("\n✓ Done\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
