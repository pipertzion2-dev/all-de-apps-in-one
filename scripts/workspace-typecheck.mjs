#!/usr/bin/env node
/**
 * CI-strict: run `pnpm run typecheck` in Pyracrypt and Ai-Tools-Hub.
 * Fails if node_modules is missing or typecheck fails.
 * Local escape hatch: SKIP_PNPM_WORKSPACES=1
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

const skip =
  process.env.SKIP_PNPM_WORKSPACES === "1" ||
  /^true$/i.test(process.env.SKIP_PNPM_WORKSPACES || "");

if (skip) {
  console.warn(
    "[verify] SKIP_PNPM_WORKSPACES is set — skipping Pyracrypt & Ai-Tools-Hub (not for CI).",
  );
  process.exit(0);
}

function hasPnpm() {
  return spawnSync("pnpm", ["-v"], { encoding: "utf8", shell: true }).status === 0;
}

function runPnpmTypecheck(cwd) {
  const usePnpm = hasPnpm();
  const cmd = usePnpm ? "pnpm" : "npx";
  const args = usePnpm ? ["run", "typecheck"] : ["--yes", "pnpm@9", "run", "typecheck"];
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: true });
  return r.status === 0;
}

function typecheckWorkspace(name) {
  const cwd = resolve(root, name);
  if (!existsSync(resolve(cwd, "package.json"))) {
    console.error(`[verify] FAIL ${name}: missing package.json at ${cwd}`);
    return false;
  }
  if (!existsSync(resolve(cwd, "node_modules"))) {
    console.error(
      `[verify] FAIL ${name}: no node_modules — run: cd ${name} && pnpm install\n` +
        `          (CI must install dependencies before npm run verify:all)`,
    );
    return false;
  }
  console.log(`[verify] typecheck ${name}…`);
  if (!runPnpmTypecheck(cwd)) {
    console.error(`[verify] FAIL ${name}: pnpm run typecheck exited non-zero`);
    return false;
  }
  console.log(`[verify] OK ${name}`);
  return true;
}

let ok = true;
for (const name of ["Pyracrypt", "Ai-Tools-Hub"]) {
  if (!typecheckWorkspace(name)) ok = false;
}
process.exit(ok ? 0 : 1);
