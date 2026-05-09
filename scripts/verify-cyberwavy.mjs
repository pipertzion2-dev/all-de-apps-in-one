#!/usr/bin/env node
/**
 * CI-strict: run cyberwavy-hub `npm run typecheck` only when node_modules exists.
 * Escape hatch: SKIP_CYBERWAVY_VERIFY=1 (local only; do not use in CI).
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const cwd = resolve(root, "CYBER-SECURITY-MINI-APPS-zip/cyberwavy-hub");

if (/^1$|^true$/i.test(process.env.SKIP_CYBERWAVY_VERIFY || "")) {
  console.warn("[verify] SKIP_CYBERWAVY_VERIFY set — skipping cyberwavy-hub (not for CI).");
  process.exit(0);
}

if (!existsSync(resolve(cwd, "package.json"))) {
  console.error(`[verify] FAIL cyberwavy-hub: missing package.json at ${cwd}`);
  process.exit(1);
}
if (!existsSync(resolve(cwd, "node_modules"))) {
  console.error(
    `[verify] FAIL cyberwavy-hub: no node_modules — run: cd CYBER-SECURITY-MINI-APPS-zip/cyberwavy-hub && npm install`,
  );
  process.exit(1);
}

console.log("[verify] typecheck cyberwavy-hub…");
const r = spawnSync("npm", ["run", "typecheck"], { cwd, stdio: "inherit", shell: true });
if (r.status !== 0) {
  console.error("[verify] FAIL cyberwavy-hub: npm run typecheck exited non-zero");
  process.exit(1);
}
console.log("[verify] OK cyberwavy-hub");
process.exit(0);
