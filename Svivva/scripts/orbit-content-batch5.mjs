#!/usr/bin/env node
/** Batch #5 — high-intent "vs / alternatives" comparison pages for bottom-of-funnel SEO. */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const name of [".env.orbit", ".env"]) {
  const p = resolve(repoRoot, name);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const SITE = (process.env.SVIVVA_URL || "https://svivva.com").replace(/\/$/, "");
const SECRET = process.env.ORBIT_INTERNAL_SECRET;
if (!SECRET) process.exit(1);

const pages = [
  {
    slug: "svivva-vs-zapier",
    keyword: "svivva vs zapier",
    title: "Svivva vs Zapier — When to Use Each (2026)",
    headline: "Svivva vs Zapier",
    subheadline: "Automation glue vs callable AI endpoints.",
    metaDescription:
      "Svivva vs Zapier compared: when to use workflow automation vs prompt-to-API endpoints for AI features and integrations.",
    benefits: ["Clear use-case split", "No wrong-tool guilt", "Ship faster"],
    howItWorks: "Zapier connects apps; Svivva publishes AI behavior as HTTPS endpoints your app calls.",
    whoItsFor: "Teams adding AI features who need both glue and owned APIs.",
    content: `<p>Zapier excels at connecting SaaS tools with triggers and actions. Svivva excels at publishing AI behavior as a callable API. They solve different problems — and many teams use both.</p><h2>Comparison</h2><table><tr><th></th><th>Zapier</th><th>Svivva</th></tr><tr><td>Best for</td><td>Internal automations</td><td>User-facing AI endpoints</td></tr><tr><td>Latency</td><td>Background jobs</td><td>Low-latency HTTPS</td></tr><tr><td>Output</td><td>App actions</td><td>Structured JSON</td></tr></table><h2>FAQ</h2><h3>Can they work together?</h3><p>Yes — Zapier for ops glue, Svivva endpoints for product AI features.</p>`,
  },
  {
    slug: "svivva-vs-make",
    keyword: "svivva vs make",
    title: "Svivva vs Make (Integromat) — Comparison",
    headline: "Svivva vs Make",
    subheadline: "Visual automation vs AI API endpoints.",
    metaDescription: "Svivva vs Make: compare visual workflow automation with prompt-to-API endpoints for shipping AI in your product.",
    benefits: ["Pick the right tool", "Avoid over-automation", "Ship AI fast"],
    howItWorks: "Make wires scenarios; Svivva gives you an endpoint defined by a prompt.",
    whoItsFor: "Founders balancing ops automation and in-app AI.",
    content: `<p>Make is powerful for multi-step visual automations. Svivva is faster when you need a single AI capability behind an HTTPS URL in your app.</p><h2>When Make wins</h2><p>Complex internal workflows across many SaaS tools.</p><h2>When Svivva wins</h2><p>User-facing generation, classification, or extraction with a stable API contract.</p>`,
  },
  {
    slug: "svivva-vs-n8n",
    keyword: "svivva vs n8n",
    title: "Svivva vs n8n — Which Fits Your Stack?",
    headline: "Svivva vs n8n",
    subheadline: "Self-hosted workflows vs zero-ops AI APIs.",
    metaDescription: "Svivva vs n8n compared for developers: workflow automation vs prompt-to-API for production AI features.",
    benefits: ["Self-host vs zero ops", "Clear split", "Composable stack"],
    howItWorks: "n8n runs your automation graph; Svivva hosts the AI endpoint your app calls.",
    whoItsFor: "Developers who want workflows and AI endpoints without one tool doing everything.",
    content: `<p>n8n gives you control with self-hosted workflow graphs. Svivva removes backend work for AI endpoints. Use n8n for orchestration and Svivva for the AI step your users touch.</p>`,
  },
  {
    slug: "best-prompt-to-api-tools-2026",
    keyword: "best prompt to api tools 2026",
    title: "Best Prompt-to-API Tools in 2026 (Compared)",
    headline: "Best Prompt-to-API Tools 2026",
    subheadline: "Ship AI endpoints without building a backend.",
    metaDescription: "Compare the best prompt-to-API tools in 2026 — speed, structured output, and production readiness for indie hackers and teams.",
    benefits: ["Faster shipping", "Structured outputs", "Per-request pricing"],
    howItWorks: "Describe behavior → deploy endpoint → call over HTTPS from any stack.",
    whoItsFor: "Anyone adding AI to an existing product this quarter.",
    content: `<p>The prompt-to-API category lets you define AI behavior in plain language and get a live endpoint. Evaluate tools on structured output validation, iteration speed, and ops overhead.</p><p>Svivva focuses on schema-validated responses, rollback, and a large free tools funnel for top-of-funnel traffic.</p>`,
  },
];

async function main() {
  const res = await fetch(`${SITE}/api/orbit/ingest-content`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-secret": SECRET },
    body: JSON.stringify({ seoPages: pages }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(json);
    process.exit(1);
  }
  console.log(`Published ${json.created?.length || 0} pages`);
  for (const c of json.created || []) console.log(`  · ${c.url}`);
}

main();
