#!/usr/bin/env node
/**
 * Content batch #4 — "content database" play (Starter Story model).
 * A deeply-interlinked programmatic set:
 *   • use-case pages: "AI API for <task>" (unique prose + example I/O + FAQ + links)
 *   • language pages: "AI API in <language>" (UNIQUE working code per page)
 * Every page carries 3+ uniqueness vectors and links to siblings + hubs, so the
 * set reads as a real database, not thin doorway pages. Publishes via ingest+IndexNow.
 */
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
if (!SECRET) {
  console.error("Missing ORBIT_INTERNAL_SECRET");
  process.exit(1);
}

// ── Use-case pages: AI API for <task> ───────────────────────────────────────
const useCases = [
  {
    task: "summarization",
    title: "Text Summarization",
    intro:
      "Long documents, threads, and transcripts are everywhere — and nobody reads them. A summarization endpoint turns any block of text into a tight, faithful summary your app can show instantly.",
    inEx: '{ "text": "<a 1,200-word support thread>", "length": "3 sentences" }',
    outEx: '{ "summary": "The customer could not reset their password because the email was going to spam. Support whitelisted the domain and sent a manual reset link. The issue is resolved and a follow-up was scheduled." }',
    use: "Summarize support tickets, meeting transcripts, articles, reviews, and PDFs.",
  },
  {
    task: "sentiment-analysis",
    title: "Sentiment Analysis",
    intro:
      "Knowing whether feedback is positive, negative, or mixed lets you route, prioritize, and measure at scale. A sentiment endpoint scores any text in one call.",
    inEx: '{ "text": "Honestly the onboarding was rough but support saved it." }',
    outEx: '{ "sentiment": "mixed", "score": 0.2, "aspects": { "onboarding": "negative", "support": "positive" } }',
    use: "Score reviews, tickets, survey responses, and social mentions.",
  },
  {
    task: "content-moderation",
    title: "Content Moderation",
    intro:
      "User-generated content needs a gate. A moderation endpoint flags toxic, unsafe, or off-topic text before it ever reaches your users.",
    inEx: '{ "text": "<user comment>", "policies": ["harassment", "spam"] }',
    outEx: '{ "allowed": false, "flags": ["harassment"], "severity": "high", "reason": "Targeted insult toward another user." }',
    use: "Gate comments, marketplace listings, chat messages, and reviews.",
  },
  {
    task: "data-extraction",
    title: "Structured Data Extraction",
    intro:
      "Turn messy text — invoices, emails, resumes — into clean JSON. An extraction endpoint pulls exactly the fields you define, every time.",
    inEx: '{ "text": "Invoice #4471 from Acme, due 2026-07-15, total $2,300.", "fields": ["invoice_no", "vendor", "due_date", "total"] }',
    outEx: '{ "invoice_no": "4471", "vendor": "Acme", "due_date": "2026-07-15", "total": 2300 }',
    use: "Parse invoices, emails, resumes, receipts, and forms into structured records.",
  },
  {
    task: "translation",
    title: "Translation",
    intro:
      "Reach users in their language without a localization pipeline. A translation endpoint converts text between languages while preserving tone and formatting.",
    inEx: '{ "text": "Your order has shipped and will arrive Tuesday.", "to": "es" }',
    outEx: '{ "translation": "Tu pedido ha sido enviado y llegará el martes." }',
    use: "Localize notifications, support replies, product copy, and UI strings.",
  },
  {
    task: "text-classification",
    title: "Text Classification",
    intro:
      "Route and tag text automatically. A classification endpoint assigns any input to your own categories — no model training required.",
    inEx: '{ "text": "I was double charged this month.", "labels": ["billing", "bug", "feature_request", "other"] }',
    outEx: '{ "label": "billing", "confidence": 0.97 }',
    use: "Triage tickets, tag leads, sort feedback, and route messages.",
  },
  {
    task: "entity-extraction",
    title: "Entity Extraction",
    intro:
      "Pull people, companies, dates, and amounts out of free text. An entity endpoint returns named entities your app can act on.",
    inEx: '{ "text": "Tim Cook met with Acme Corp on March 3 to sign a $4M deal." }',
    outEx: '{ "people": ["Tim Cook"], "orgs": ["Acme Corp"], "dates": ["March 3"], "amounts": ["$4M"] }',
    use: "Enrich CRM records, index documents, and build search filters.",
  },
  {
    task: "content-generation",
    title: "Content Generation",
    intro:
      "Generate on-brand copy on demand — product descriptions, replies, summaries, variations. A generation endpoint returns structured, usable output.",
    inEx: '{ "product": "noise-cancelling headphones", "tone": "punchy", "format": "3 bullet points" }',
    outEx: '{ "bullets": ["Silence the world with adaptive ANC.", "40-hour battery — a week per charge.", "Memory-foam comfort for all-day wear."] }',
    use: "Generate product copy, email drafts, social posts, and reply suggestions.",
  },
];

// ── Language pages: AI API in <language> (unique code per page) ──────────────
const languages = [
  {
    slug: "python",
    name: "Python",
    keyword: "ai api python",
    code: `import requests

resp = requests.post(
    "https://your-endpoint.example/run",
    json={"text": "Summarize this article in two sentences."},
    headers={"Content-Type": "application/json"},
    timeout=30,
)
resp.raise_for_status()
print(resp.json()["result"])`,
  },
  {
    slug: "nodejs",
    name: "Node.js",
    keyword: "ai api node.js",
    code: `const res = await fetch("https://your-endpoint.example/run", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "Summarize this article in two sentences." }),
});
if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
const { result } = await res.json();
console.log(result);`,
  },
  {
    slug: "golang",
    name: "Go",
    keyword: "ai api golang",
    code: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	body, _ := json.Marshal(map[string]string{"text": "Summarize this in two sentences."})
	resp, err := http.Post("https://your-endpoint.example/run", "application/json", bytes.NewReader(body))
	if err != nil { panic(err) }
	defer resp.Body.Close()
	var out map[string]any
	json.NewDecoder(resp.Body).Decode(&out)
	fmt.Println(out["result"])
}`,
  },
  {
    slug: "php",
    name: "PHP",
    keyword: "ai api php",
    code: `<?php
$ch = curl_init("https://your-endpoint.example/run");
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => ["Content-Type: application/json"],
  CURLOPT_POSTFIELDS => json_encode(["text" => "Summarize this in two sentences."]),
]);
$out = json_decode(curl_exec($ch), true);
curl_close($ch);
echo $out["result"];`,
  },
  {
    slug: "ruby",
    name: "Ruby",
    keyword: "ai api ruby",
    code: `require "net/http"
require "json"

uri = URI("https://your-endpoint.example/run")
res = Net::HTTP.post(uri, { text: "Summarize this in two sentences." }.to_json,
                     "Content-Type" => "application/json")
puts JSON.parse(res.body)["result"]`,
  },
  {
    slug: "curl",
    name: "cURL",
    keyword: "ai api curl",
    code: `curl -X POST https://your-endpoint.example/run \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Summarize this article in two sentences."}'`,
  },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Relational links — every page links to siblings + hubs (the "database" effect).
function relatedLinks(currentSlug) {
  const sib = [
    ...useCases.map((u) => ({ slug: `ai-api-for-${u.task}`, label: `AI API for ${u.title}` })),
    ...languages.map((l) => ({ slug: `ai-api-${l.slug}`, label: `AI API in ${l.name}` })),
  ]
    .filter((x) => x.slug !== currentSlug)
    .slice(0, 6);
  const items = sib
    .map((s) => `<li><a href="${SITE}/${s.slug}">${s.label}</a></li>`)
    .join("");
  return `<h2>Related</h2><ul>${items}<li><a href="${SITE}/ai-api-builder">AI API Builder</a></li><li><a href="${SITE}/tools">All free tools</a></li><li><a href="${SITE}/blog">Guides &amp; articles</a></li></ul>`;
}

const seoPages = [];

for (const u of useCases) {
  const slug = `ai-api-for-${u.task}`;
  const content =
    `<p>${u.intro}</p>` +
    `<h2>Example</h2>` +
    `<p>Request:</p><pre><code>${esc(u.inEx)}</code></pre>` +
    `<p>Response:</p><pre><code>${esc(u.outEx)}</code></pre>` +
    `<h2>Why a prompt-to-API endpoint</h2>` +
    `<p>Define the behavior once as a prompt, deploy it as an HTTPS endpoint, and call it from any language. No model wiring, no server to maintain, and you change behavior by editing the prompt — not redeploying your app. ${u.use}</p>` +
    `<h2>Frequently asked questions</h2>` +
    `<h3>Can I use this without a backend?</h3><p>Yes. The endpoint is a live HTTPS URL; your app just makes a request. There's no server for you to run.</p>` +
    `<h3>How do I keep the output consistent?</h3><p>Specify the exact output shape (JSON) in the prompt and validate the response in your app before using it.</p>` +
    `<h3>What does it cost?</h3><p>Per-request pricing means an idle endpoint costs almost nothing — you pay for actual usage.</p>` +
    relatedLinks(slug);
  seoPages.push({
    keyword: `ai api for ${u.task.replace(/-/g, " ")}`,
    slug,
    title: `AI API for ${u.title} — Deploy in Minutes | Svivva`,
    headline: `AI API for ${u.title}`,
    subheadline: `A callable ${u.title.toLowerCase()} endpoint — no backend.`,
    category: "seo-landing",
    metaDescription: `Add ${u.title.toLowerCase()} to your app with a callable AI API. ${u.intro.slice(0, 90)}`,
    benefits: [
      `Ship ${u.title.toLowerCase()} in minutes`,
      "No backend, hosting, or model wiring",
      "Structured JSON output you can trust",
    ],
    howItWorks: `Define the behavior as a prompt, deploy the endpoint, and call it over HTTPS. ${u.use}`,
    whoItsFor: "Developers and founders adding AI features without building a backend.",
    content,
  });
}

for (const l of languages) {
  const slug = `ai-api-${l.slug}`;
  const content =
    `<p>Calling an AI API from ${l.name} takes a single HTTP request. Define your endpoint's behavior as a prompt on Svivva, then call it like any other JSON API from your ${l.name} code.</p>` +
    `<h2>${l.name} example</h2>` +
    `<pre><code>${esc(l.code)}</code></pre>` +
    `<h2>Notes</h2>` +
    `<ul><li>The endpoint is a normal HTTPS URL — no SDK required.</li><li>Send your input as JSON; read the structured result from the response.</li><li>Add a timeout and check the status code, as shown above.</li></ul>` +
    `<h2>Frequently asked questions</h2>` +
    `<h3>Do I need an SDK to call an AI API in ${l.name}?</h3><p>No. Any ${l.name} HTTP client works because the endpoint is plain HTTPS + JSON.</p>` +
    `<h3>How do I change the AI behavior?</h3><p>Edit the prompt that defines the endpoint. Your ${l.name} code and the request contract stay the same.</p>` +
    `<h3>Is this production-ready?</h3><p>Yes — add input validation, a timeout, and error handling (shown above), and you can ship it.</p>` +
    relatedLinks(slug);
  seoPages.push({
    keyword: l.keyword,
    slug,
    title: `How to Call an AI API in ${l.name} (Example) | Svivva`,
    headline: `Call an AI API in ${l.name}`,
    subheadline: `One HTTP request — copy, paste, ship.`,
    category: "seo-landing",
    metaDescription: `Call an AI API in ${l.name} with a single HTTP request. Copy-paste example plus how to keep output structured and production-ready.`,
    benefits: [
      `Working ${l.name} code you can copy`,
      "No SDK — plain HTTPS + JSON",
      "Change AI behavior without touching your code",
    ],
    howItWorks: `Deploy a prompt-to-API endpoint, then call it from ${l.name} using the example above.`,
    whoItsFor: `${l.name} developers adding AI features fast.`,
    content,
  });
}

async function main() {
  console.log(`Publishing ${seoPages.length} interlinked programmatic pages to ${SITE}…\n`);
  const res = await fetch(`${SITE}/api/orbit/ingest-content`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-secret": SECRET },
    body: JSON.stringify({ seoPages }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`HTTP ${res.status}:`, JSON.stringify(json).slice(0, 800));
    process.exit(1);
  }
  console.log(`Created ${json.created?.length || 0} page(s):`);
  for (const c of json.created || []) console.log(`  · ${c.url}`);
  console.log(`\nIndexNow: ${json.indexNow?.ok ? "ok" : "skipped"} (${json.indexNow?.submitted || 0} URLs)`);
  if (json.errors?.length) {
    console.log("\nErrors:");
    for (const e of json.errors) console.log(`  · ${e}`);
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
