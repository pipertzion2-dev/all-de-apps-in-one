#!/usr/bin/env node
/**
 * Clear stale GSC OAuth (if deployed), start manual reconnect, then re-run indexing.
 */
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureOrbitAuth, loadOrbitEnv, orbitFetch } from "./orbit-api-auth.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

loadOrbitEnv();
const SITE = (process.env.SVIVVA_URL || "https://zzaizzai.com").replace(/\/$/, "");

async function main() {
  const auth = await ensureOrbitAuth(SITE);
  console.log(`\n🔑 GSC reconnect + indexing — ${SITE}\n`);

  const clear = await orbitFetch(auth, "/api/gsc/save", {
    method: "POST",
    body: { action: "clear_oauth" },
  });
  if (clear.res.ok) {
    console.log("✓ Cleared stale OAuth token\n");
  } else {
    console.log("· clear_oauth not available yet (deploy PR #209) — continuing\n");
  }

  const start = await orbitFetch(auth, "/api/gsc/oauth/manual/start", {
    method: "POST",
    body: { returnTo: "/dashboard/gsc-connect", email: "pipertzion2@gmail.com" },
  });
  if (!start.res.ok) {
    console.error("Failed to start OAuth:", start.json);
    process.exit(1);
  }

  console.log("═".repeat(60));
  console.log("STEP 1 — Open this URL and sign in with Google:\n");
  console.log(start.json.googleUrl);
  console.log("\n═".repeat(60));
  console.log(
    "\nSTEP 2 — After Google redirects, copy the FULL callback URL from your browser",
  );
  console.log("(should contain ?code=…&state=…)\n");
  console.log("STEP 3 — Run:\n");
  console.log(
    `  node scripts/gsc-reconnect-and-index.mjs finish "<paste callback url here>"\n`,
  );
  console.log(`OAuth state expires: ${start.json.expiresAt}\n`);

  const callbackUrl = process.argv[2];
  if (process.argv[2] === "finish" && process.argv[3]) {
    const url = process.argv[3];
    console.log("Finishing OAuth…\n");
    const complete = await orbitFetch(auth, "/api/gsc/oauth/manual/complete", {
      method: "POST",
      body: { callbackUrl: url },
      timeoutMs: 120_000,
    });
    console.log("Complete:", JSON.stringify(complete.json, null, 2));
    if (!complete.res.ok) process.exit(1);

    console.log("\nRunning full indexing…\n");
    const { spawnSync } = await import("node:child_process");
    const r = spawnSync("node", ["scripts/run-full-indexing.mjs"], {
      cwd: new URL(".", import.meta.url).pathname.replace(/\/scripts\/.*$/, ""),
      stdio: "inherit",
      env: process.env,
    });
    process.exit(r.status ?? 0);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
