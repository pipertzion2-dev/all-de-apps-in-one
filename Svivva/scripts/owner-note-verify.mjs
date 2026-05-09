#!/usr/bin/env node
/**
 * Verbatim owner note (from product brief — typos preserved):
 *
 * "Analyze my entire app and make sure it works properly in every way way and no placeholders at all then push to GitHub ..organize everything ina more clean and clear manner."
 *
 * Build wiring (`npm run verify`, then `build:vercel` / `script/build.ts`) applies this as:
 * - Analyze entire app → full-project `tsc` + `eslint` (run before this script via npm `verify`)
 * - Works properly → production `next build` runs immediately after `verify` in `build:vercel`; self-hosted `tsx script/build.ts` runs `verify` then DB push + `next build`
 * - No placeholders → scans ship-path sources for dummy copy patterns below (not HTML input `placeholder=` hints)
 * - Push to GitHub → satisfied by CI / your workflow when you commit & push
 * - Organize clean → run `npm run format` on touched areas when editing (repo-wide Prettier not enforced yet)
 */

const OWNER_NOTE_VERBATIM =
  "Analyze my entire app and make sure it works properly in every way way and no placeholders at all then push to GitHub ..organize everything ina more clean and clear manner.";

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "coverage",
  ".git",
  ".turbo",
  ".cache",
  ".local",
  "attached_assets",
]);

const EXT_OK = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

/** Lines matching these are blocked ship placeholders (not JSX `placeholder="..."` UX hints). */
const LINE_PATTERNS = [
  { re: /\blorem\s+ipsum\b/i, label: "lorem ipsum" },
  { re: /\bdolor\s+sit\s+amet\b/i, label: "Latin filler (dolor sit amet)" },
  // Uppercase stub only (allows Tailwind `data-[placeholder]:…`)
  { re: /\[\s*PLACEHOLDER\s*\]/, label: "[PLACEHOLDER]" },
  { re: /\bYOUR_API_KEY_HERE\b/, label: "YOUR_API_KEY_HERE" },
  { re: /\bCHANGE_ME_NOW\b/, label: "CHANGE_ME_NOW" },
];

const SKIP_FILES = new Set(["scripts/owner-note-verify.mjs"]);

function safeWalk(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return [];
  return walk(p);
}

function walk(dir, files = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(full, files);
    } else {
      const ext = path.extname(e.name);
      if (EXT_OK.has(ext)) files.push(full);
    }
  }
  return files;
}

function scanFile(filePath) {
  const rel = path.relative(ROOT, filePath);
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (/^\s*(?:\/\/|\/\*|\*)/.test(line)) continue;
    // Ignore JSX/HTML hint attributes like placeholder="…"
    line = line.replace(/\bplaceholder\s*=\s*\{[^}]*\}/g, "");
    line = line.replace(/\bplaceholder\s*=\s*["'][^"']*["']/gi, "");
    for (const { re, label } of LINE_PATTERNS) {
      if (re.test(line)) hits.push({ line: i + 1, label, snippet: lines[i].trim().slice(0, 120) });
    }
  }
  return hits.length ? { rel, hits } : null;
}

console.log("\n── Owner note (verbatim) ───────────────────────────────────────────────");
console.log(OWNER_NOTE_VERBATIM);
console.log("── Placeholder scan (no dummy ship copy) ─────────────────────────────\n");

const roots = ["app", "components", "lib", "hooks", "shared", "server", "script", "scripts"];
const allFiles = roots.flatMap((r) => safeWalk(r));

const problems = [];
for (const f of allFiles) {
  const rel = path.relative(ROOT, f).split(path.sep).join("/");
  if (SKIP_FILES.has(rel)) continue;
  const r = scanFile(f);
  if (r) problems.push(r);
}

if (problems.length > 0) {
  for (const { rel, hits } of problems) {
    console.error(`\n${rel}`);
    for (const h of hits) console.error(`  line ${h.line} [${h.label}]: ${h.snippet}`);
  }
  console.error("\n✖ Owner-note gate failed: remove dummy placeholders from ship paths.\n");
  process.exit(1);
}

console.log(
  "✓ No blocked placeholder patterns under app/, components/, lib/, hooks/, shared/, server/, script/\n",
);
