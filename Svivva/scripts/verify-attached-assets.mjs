#!/usr/bin/env node
/**
 * Svivva/attached_assets should only contain images imported by the app (see grep @/attached_assets).
 * Bulk Replit drops were removed from git — do not re-commit without updating imports + .vercelignore.
 */
import { execSync } from "child_process";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const ALLOW = new Set([
  "5C21F641-65DD-4255-A832-F60282E2CBF0_1771895543298.png",
  "CC8F1D0D-DB63-46FD-8F9A-AC9A1FAB40DE_1770908649745.png",
  "IMG_1493_1770509047497.png",
  "SVIVVA_OFFICIAL_LOGO_1769201341308.png",
  "Svivva_Crate_1770908797554.png",
  "Svivva_Seeds_6_1771888740460.png",
  "Svivva_official_3_1769474625495.png",
  "Svivva_print_2_1769474625495.png",
]);

const assetsDir = path.join(projectRoot, "attached_assets");

function getAssetPaths() {
  try {
    const out = execSync("git ls-files -z attached_assets/", {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return out
      .split("\0")
      .filter(Boolean)
      .map((p) => path.basename(p));
  } catch {
    // Vercel remote builds don't include a .git checkout. Fall back to filesystem files.
    const files = fs.readdirSync(assetsDir, { withFileTypes: true });
    return files.filter((entry) => entry.isFile()).map((entry) => entry.name);
  }
}

const tracked = getAssetPaths();

const extra = tracked.filter((p) => !ALLOW.has(p));
const missing = [...ALLOW].filter((p) => !tracked.includes(p));

if (extra.length || missing.length) {
  console.error("\n✖ Svivva attached_assets allowlist mismatch.\n");
  if (extra.length) {
    console.error("Unexpected tracked files (remove from git or update ALLOW + imports):");
    extra.forEach((p) => console.error(" ", p));
  }
  if (missing.length) {
    console.error("Missing required files:");
    missing.forEach((p) => console.error(" ", p));
  }
  console.error("");
  process.exit(1);
}

console.log("✓ Svivva/attached_assets matches allowlist (8 files).\n");
