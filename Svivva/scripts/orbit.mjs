#!/usr/bin/env node
/**
 * Orbit marketing CLI — run the full marketing engine from your terminal (or an
 * AI agent) without opening svivva.com.
 *
 * Auth: calls production API routes with the x-internal-secret header, so it
 * needs ORBIT_INTERNAL_SECRET (the same value set in Vercel) and the site URL.
 *
 * Config (env or .env.orbit in repo root — see scripts/orbit.env.example):
 *   SVIVVA_URL=https://svivva.com            (default https://svivva.com)
 *   ORBIT_INTERNAL_SECRET=...                (required — matches Vercel)
 *
 * Commands:
 *   node scripts/orbit.mjs status                 Credential + index coverage snapshot
 *   node scripts/orbit.mjs health [--resubmit]    Thorough index-health crawl (+ re-ping)
 *   node scripts/orbit.mjs run                     Full marketing autopilot (AI + indexing)
 *   node scripts/orbit.mjs research [--count N] [--focus "topic"]   Keyword/blog research
 *   node scripts/orbit.mjs ingest <file.json>     Publish agent-written content + index it
 *
 * ingest file shape:
 *   { "blogPosts": [{ "title": "...", "content": "# md..." }],
 *     "seoPages":  [{ "keyword": "...", "title": "...", "headline": "...", "content": "..." }] }
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

function loadDotEnvOrbit() {
  for (const name of [".env.orbit", ".env"]) {
    const p = resolve(repoRoot, name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2].replace(/^["']|["']$/g, "");
      if (!process.env[key] && val) process.env[key] = val;
    }
  }
}
loadDotEnvOrbit();

const SITE = (process.env.SVIVVA_URL || "https://svivva.com").replace(/\/$/, "");
const SECRET = process.env.ORBIT_INTERNAL_SECRET || "";

function die(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

if (!SECRET) {
  die(
    "ORBIT_INTERNAL_SECRET is not set.\n" +
      "  cp scripts/orbit.env.example .env.orbit  then fill it in (must match Vercel).\n" +
      "  Get it: Vercel → Project → Settings → Environment Variables → ORBIT_INTERNAL_SECRET",
  );
}

function arg(flag, fallback = undefined) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : fallback;
}
function hasFlag(flag) {
  return process.argv.includes(flag);
}

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${SITE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": SECRET,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    die(`${method} ${path} → HTTP ${res.status}\n  ${JSON.stringify(json).slice(0, 500)}`);
  }
  return json;
}

function header(t) {
  console.log(`\n\x1b[1m${t}\x1b[0m`);
  console.log("─".repeat(Math.min(t.length, 60)));
}

async function cmdStatus() {
  header(`Orbit status — ${SITE}`);
  const s = await api("/api/orbit/marketing-autopilot");
  console.log(`AI provider:    ${s.ai?.provider || "?"} (${s.ai?.configured ? "ready" : "NOT configured"})`);
  const configured = Object.entries(s.credentials || {}).map(([k]) => k);
  console.log(`Credentials set: ${configured.length ? configured.join(", ") : "(none)"}`);
  console.log(`GSC connected:   ${s.status?.google?.siteUrl ? "yes" : "no"}`);

  const cov = await api("/api/orbit/index-health");
  const c = cov.snapshot || {};
  console.log(`\nIndex coverage:  ${c.submitted ?? 0}/${c.totalUrls ?? 0} URLs submitted, ${c.confirmed ?? 0} confirmed live`);
  console.log(`Stale URLs:      ${c.stale ?? 0} (need re-submission)`);
  console.log(`Last health run: ${c.lastRunAt || "never"}${c.lastScore != null ? ` (score ${c.lastScore})` : ""}`);
}

async function cmdHealth() {
  const resubmit = hasFlag("--resubmit");
  header(`Index health crawl${resubmit ? " + re-submit" : ""} — ${SITE}`);
  console.log("Crawling sampled URLs… (this checks they are live + indexable)\n");
  const r = await api("/api/orbit/index-health", {
    method: "POST",
    body: { resubmit, googleMaxBatches: 3 },
  });
  const h = r.health || {};
  console.log(`Score:        ${h.score}/100`);
  console.log(`Sampled:      ${h.indexable}/${h.sampled} indexable, ${h.blocked} blocked`);
  console.log(`Coverage:     ${h.coverage?.submitted ?? 0}/${h.coverage?.totalUrls ?? 0} submitted (${h.coverage?.pct ?? 0}%)`);
  console.log(`Stale URLs:   ${h.staleUrls}`);
  console.log(`\n${h.summary || ""}`);
  if (h.problems?.length) {
    console.log(`\n⚠ Problem URLs (${h.problems.length}):`);
    for (const p of h.problems.slice(0, 15)) {
      console.log(`  · [${p.httpStatus}] ${p.url} — ${p.notes}`);
    }
  }
  if (r.resubmission) {
    console.log(`\nRe-submission:`);
    for (const line of r.resubmission.summary || []) console.log(`  ${line}`);
  }
}

async function cmdRun() {
  header(`Marketing autopilot — ${SITE}`);
  console.log("Running full engine (on-site content + indexing + AI copy + publishing)…");
  console.log("This can take a few minutes.\n");
  const r = await api("/api/orbit/marketing-autopilot", {
    method: "POST",
    body: { action: "run" },
  });
  console.log(r.summary || "(no summary)");
  if (r.indexing?.health) {
    const h = r.indexing.health;
    console.log(`\nIndex health: score ${h.score}/100, ${h.indexable}/${h.sampled} indexable, coverage ${h.coveragePct}%`);
  }
  const st = r.stats || {};
  console.log(`\nDone. posted=${st.posted} prepared=${st.prepared} failed=${st.failed} needsCreds=${st.needsCredentials}`);
}

async function cmdMiniApps() {
  header(`Mini-app / tool funnel audit — ${SITE}`);
  console.log("Checking your tool pages are connected, in the sitemap, live & funneling…\n");
  const r = await api("/api/orbit/mini-apps-audit", { method: "POST", body: { submit: true } });
  console.log(`Mini-apps found:   ${r.totalMiniApps}`);
  console.log(`In sitemap:        ${r.inSitemap}/${r.totalMiniApps}`);
  console.log(`Sampled live:      ${r.live}/${r.sampled}`);
  console.log(`Sampled indexable: ${r.indexable}/${r.sampled}`);
  console.log(`Link to product:   ${r.withFunnelLink}/${r.sampled} (funnel)`);
  console.log(`IndexNow:          ${r.indexNow?.ok ? "ok" : "skipped"} (${r.indexNow?.submitted || 0}/${r.indexNow?.total || 0} submitted)`);
  console.log(`\n${r.summary || ""}`);
  if (r.problems?.length) {
    console.log(`\n⚠ Pages needing attention (${r.problems.length}):`);
    for (const p of r.problems.slice(0, 20)) {
      const flags = [
        p.inSitemap ? "" : "not-in-sitemap",
        p.indexable ? "" : `not-indexable(${p.notes})`,
        p.funnelLink ? "" : "no-funnel-link",
      ]
        .filter(Boolean)
        .join(", ");
      console.log(`  · ${p.url} — ${flags}`);
    }
  } else {
    console.log("\n✓ All mini-apps are connected, indexable, and funneling to the main product.");
  }
}

async function cmdResearch() {
  const count = Number(arg("--count", "12"));
  const focus = arg("--focus");
  header(`Keyword + blog research — ${SITE}`);
  const r = await api("/api/orbit/research-keywords", {
    method: "POST",
    body: { count, focus },
  });
  console.log(`Model: ${r.model} · ${r.count} ideas\n`);
  for (const idea of r.ideas || []) {
    console.log(`\x1b[1m${idea.keyword}\x1b[0m  [${idea.intent}/${idea.difficulty}/${idea.contentType}]`);
    console.log(`  Title: ${idea.titleSuggestion}`);
    console.log(`  Why:   ${idea.rationale}`);
    if (idea.outline?.length) console.log(`  Outline: ${idea.outline.join(" · ")}`);
    console.log("");
  }
  console.log("Tip: write these up and publish with `node scripts/orbit.mjs ingest <file.json>`");
}

async function cmdIngest() {
  const file = process.argv[3];
  if (!file) die("Usage: node scripts/orbit.mjs ingest <file.json>");
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) die(`File not found: ${path}`);
  const payload = JSON.parse(readFileSync(path, "utf8"));
  header(`Ingest content — ${SITE}`);
  const r = await api("/api/orbit/ingest-content", { method: "POST", body: payload });
  console.log(`Created ${r.created?.length || 0} item(s):`);
  for (const c of r.created || []) console.log(`  · ${c.type}: ${c.url}`);
  console.log(`IndexNow: ${r.indexNow?.ok ? "ok" : "skipped"} (${r.indexNow?.submitted || 0} URLs)`);
  if (r.errors?.length) {
    console.log(`\n⚠ Errors:`);
    for (const e of r.errors) console.log(`  · ${e}`);
  }
}

const cmd = process.argv[2];
const commands = {
  status: cmdStatus,
  health: cmdHealth,
  run: cmdRun,
  "mini-apps": cmdMiniApps,
  research: cmdResearch,
  ingest: cmdIngest,
};

if (!cmd || !commands[cmd]) {
  console.log(
    `Orbit marketing CLI\n\nUsage:\n` +
      `  node scripts/orbit.mjs status\n` +
      `  node scripts/orbit.mjs health [--resubmit]\n` +
      `  node scripts/orbit.mjs run\n` +
      `  node scripts/orbit.mjs mini-apps\n` +
      `  node scripts/orbit.mjs research [--count N] [--focus "topic"]\n` +
      `  node scripts/orbit.mjs ingest <file.json>\n`,
  );
  process.exit(cmd ? 1 : 0);
}

commands[cmd]().catch((e) => die(e instanceof Error ? e.message : String(e)));
