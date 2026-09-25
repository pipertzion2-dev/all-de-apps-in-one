#!/usr/bin/env node
/**
 * Gentle production indexing — one throttled pass (not a stack of Orbit jobs).
 *
 * Default: GSC sitemap sync + ~200 rotated IndexNow URLs + ~200 Indexing API URLs.
 * Avoid running this back-to-back with Launchpad "Run all steps" — that duplicates work
 * and can confuse Search Console coverage.
 *
 * Auth: admin passcode (2424) or ORBIT_INTERNAL_SECRET in .env.orbit
 */
import { ensureOrbitAuth, loadOrbitEnv, orbitFetch } from "./orbit-api-auth.mjs";

loadOrbitEnv();
const SITE = (process.env.SVIVVA_URL || "https://zzaizzai.com").replace(/\/$/, "");

async function step(label, path, body = {}, timeoutMs = 300_000) {
  console.log(`\n${"═".repeat(60)}\n▶ ${label}\n   ${path}\n`);
  const auth = await ensureOrbitAuth(SITE);
  const { res, json } = await orbitFetch(auth, path, { method: "POST", body, timeoutMs });
  const ok = res.ok;
  console.log(ok ? "✓" : "✖", `HTTP ${res.status}`);
  const preview = JSON.stringify(json, null, 2);
  console.log(preview.slice(0, 2500));
  if (!ok) console.warn(`  (continuing despite failure)`);
  return { ok, json };
}

async function get(path) {
  const auth = await ensureOrbitAuth(SITE);
  const { res, json } = await orbitFetch(auth, path, { method: "GET", timeoutMs: 120_000 });
  console.log(`\n── GET ${path} → HTTP ${res.status} ──`);
  console.log(JSON.stringify(json, null, 2).slice(0, 2000));
  return { ok: res.ok, json };
}

console.log(`\n🚀 Throttled indexing run — ${SITE}\n`);
console.log(
  "Tip: Submit sitemap once in GSC UI, then let Orbit rotate ~200 URLs/day — do not bulk-request every URL.\n",
);

await get("/api/gsc/diagnose");

await step("GSC sync + rotated IndexNow + Indexing API (1 batch)", "/api/gsc/run-indexing", {});

await step("Index health sample (no resubmit)", "/api/orbit/index-health", {
  resubmit: false,
  sampleLimit: 40,
});

await get("/api/orbit/index-health");
await get("/api/gsc/diagnose");

console.log("\n✅ Throttled indexing run complete.\n");
console.log(
  "Skipped: automate-manual + index-health resubmit + traffic-quality + seo-weekly + marketing autopilot (run those separately on a schedule, not all at once).\n",
);
