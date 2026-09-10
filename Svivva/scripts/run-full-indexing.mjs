#!/usr/bin/env node
/**
 * Fire every server-side indexing action against production.
 * Auth: admin passcode (272727) or ORBIT_INTERNAL_SECRET in .env.orbit
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

console.log(`\n🚀 Full indexing run — ${SITE}\n`);

await get("/api/gsc/diagnose");

await step("GSC sync + IndexNow + Indexing API (5 batches)", "/api/gsc/run-indexing", {});

await step("Submit sitemap to GSC", "/api/gsc/save", { action: "submit_sitemap" });

await step("Automate manual indexing actions", "/api/orbit/automate-manual", {});

await step("Index health crawl + resubmit stale URLs", "/api/orbit/index-health", {
  resubmit: true,
  googleMaxBatches: 5,
});

await step("Traffic quality repair + re-index", "/api/orbit/traffic-quality-repair", {});

await step("SEO weekly routine (audit + indexing)", "/api/orbit/seo-weekly-routine", {
  skipContentGeneration: false,
});

await step("Marketing autopilot run", "/api/orbit/marketing-autopilot", { action: "run" }, 600_000);

await get("/api/orbit/index-health");
await get("/api/gsc/diagnose");

console.log("\n✅ Full indexing run complete.\n");
