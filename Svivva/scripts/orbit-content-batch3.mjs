#!/usr/bin/env node
/**
 * Content batch #3 — Opus-written. More high-intent comparison/alternative pages,
 * an internal-linking tools roundup (gives programmatic pages link juice), and
 * AI-search (GEO) explainers. Publishes via ingest + IndexNow. Re-runnable.
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

const faq = (items) =>
  `\n\n## Frequently asked questions\n\n` + items.map(([q, a]) => `### ${q}\n\n${a}`).join("\n\n");
const cta = `\n\n---\n\n**Build it on Svivva.** Turn a prompt into a deployable API and prototype with our [free AI tools](${SITE}/tools) — no signup required to start. [Get started →](${SITE})`;

const blogPosts = [
  {
    title: "RapidAPI Alternatives: Where to Build and Ship Your API in 2026",
    slug: "rapidapi-alternatives-2026",
    category: "guides",
    tags: ["rapidapi alternative", "api marketplace", "build api", "ship api"],
    metaDescription:
      "Looking for RapidAPI alternatives? Here's where to build, host, and ship APIs in 2026 — including the fastest path from idea to a live, callable endpoint.",
    content: `RapidAPI is a marketplace for finding and consuming APIs. But if your goal is to *build and ship your own* endpoint fast, you want different tools. Here are the alternatives worth knowing.

## 1. Prompt-to-API builders
The fastest path: describe the endpoint in plain English and get a live HTTPS URL. No marketplace listing required, no backend to host — ideal for AI-powered endpoints you control.

## 2. Serverless function platforms
Deploy a small function as an endpoint. More control than a marketplace, more setup than prompt-to-API. Good for custom logic.

## 3. API gateways
Put a gateway in front of services for routing, auth, and rate limits. Useful once you have several endpoints to manage.

## 4. Backend frameworks + a host
Build with a lightweight framework and deploy. Maximum flexibility, maximum maintenance.

## When a marketplace still helps
If you want *discovery* and built-in billing for a public API others pay to use, a marketplace adds value. For internal or product endpoints, skip it and ship directly.

## The fast path
For most teams, prompt-to-API gets you a live endpoint in minutes, then you integrate it anywhere. You can always list it on a marketplace later if you want distribution.${faq([
      ["What's the best RapidAPI alternative for building APIs?", "For building your own endpoints, a prompt-to-API builder is fastest — you define behavior in a prompt and get a live URL without hosting a backend."],
      ["Is RapidAPI free?", "RapidAPI has free and paid tiers, but it's a marketplace for consuming/listing APIs, not a builder. To create endpoints, pair it with a build tool."],
      ["Can I monetize an API I build?", "Yes — build and host the endpoint, then list it on a marketplace with billing, or charge directly via your own checkout."],
    ])}${cta}`,
  },
  {
    title: "n8n vs a Custom API: Automation or Owning Your Logic?",
    slug: "n8n-vs-custom-api",
    category: "guides",
    tags: ["n8n alternative", "custom api", "automation", "workflows"],
    metaDescription:
      "n8n vs building a custom API — when visual automation wins, when an owned endpoint wins, and how to combine both for the best of each.",
    content: `n8n is excellent for visual, node-based automation. A custom API gives you an owned, fast endpoint. They overlap but shine in different places.

## Setup and learning curve
- **n8n**: drag-and-drop nodes, fast for connecting known services.
- **Custom API**: traditionally slower — unless you use prompt-to-API, which is also minutes.

## Latency and user-facing use
- **n8n**: great for background automations and internal workflows.
- **Custom API**: better for low-latency, in-product features users hit directly.

## Cost at scale
- **n8n**: self-host to control cost, or pay for cloud.
- **Custom API**: per-request pricing stays predictable and cheap for idle endpoints.

## Control
- **n8n**: bounded by available nodes and their options.
- **Custom API**: total control of input, output, and logic.

## The combo that wins
Use n8n for internal glue and scheduled jobs; use a custom API (built via prompt-to-API) for the AI features your users touch. They complement each other.${faq([
      ["Is n8n better than a custom API?", "For internal automation and connecting SaaS tools, n8n is great. For low-latency, user-facing features you own, a custom API is better. Many teams use both."],
      ["Can I build a custom API as fast as an n8n workflow?", "Yes — prompt-to-API gets you a live endpoint in minutes, comparable to wiring an n8n flow, with full control over the contract."],
      ["Which is cheaper?", "Self-hosted n8n and per-request custom APIs are both cost-efficient; custom APIs give the most predictable cost for idle, user-facing endpoints."],
    ])}${cta}`,
  },
  {
    title: "How to Add a ChatGPT Chatbot to Your Website (No Backend)",
    slug: "add-chatgpt-chatbot-to-website-no-backend",
    category: "guides",
    tags: ["chatgpt chatbot", "website chatbot", "ai api", "no backend"],
    metaDescription:
      "Add a ChatGPT-style chatbot to your website without building a backend. A step-by-step guide using a prompt-to-API endpoint and a few lines of frontend code.",
    content: `You want a chatbot on your site, but you don't want to run a server. Here's how to do it with a prompt-to-API endpoint and minimal frontend code.

## Step 1: Define the bot's behavior as a prompt
Write the system behavior: tone, what it knows, what it should refuse. This is your bot's "personality" and guardrails in one place.

## Step 2: Publish it as an endpoint
Turn the prompt into a live HTTPS endpoint. It accepts the user's message and returns the reply — no server for you to maintain.

## Step 3: Add a chat widget
\`\`\`js
async function ask(message) {
  const res = await fetch("https://your-endpoint.example/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  const { reply } = await res.json();
  return reply;
}
\`\`\`
Wire that to a simple input box and message list.

## Step 4: Add guardrails
Limit message length, rate-limit per visitor, and handle errors gracefully so a hiccup doesn't break the page.

## Step 5: Improve by editing the prompt
Want a friendlier tone or new knowledge? Update the prompt. No redeploy of your site needed.${faq([
      ["Can I add a ChatGPT chatbot without a backend?", "Yes. Publish your prompt as a prompt-to-API endpoint and call it from a small frontend widget — no server to run."],
      ["How much code do I need?", "Just a fetch call and a basic chat UI. The bot's behavior lives in the prompt, not in backend code."],
      ["How do I control what the bot says?", "Define tone, knowledge, and refusals in the system prompt, and add length/rate limits in your widget."],
    ])}${cta}`,
  },
  {
    title: "Retool Alternatives for Internal Tools That Call AI",
    slug: "retool-alternatives-internal-tools-ai",
    category: "guides",
    tags: ["retool alternative", "internal tools", "ai api", "developers"],
    metaDescription:
      "Retool alternatives for building internal tools that call AI — compare options and learn the fastest way to wire an AI endpoint into your admin panels.",
    content: `Retool is a strong internal-tools builder. If you're specifically wiring AI into internal apps, here are alternatives and complements to consider.

## 1. Prompt-to-API + any UI builder
Build the AI logic as an endpoint and call it from whatever UI layer you like. This decouples your AI from any single platform.

## 2. Lightweight admin frameworks
Open-source admin panels give you CRUD fast; add an AI endpoint for the smart parts.

## 3. Spreadsheet-driven tools
For simple internal ops, a spreadsheet front-end that calls an AI endpoint is often enough.

## 4. Notebook-style tools
For data teams, notebooks that hit an AI endpoint keep everything in one place.

## The pattern that lasts
Whatever UI you choose, keep the AI behavior in a prompt-to-API endpoint. If you switch internal-tool platforms later, your AI logic comes with you unchanged.${faq([
      ["What's a good Retool alternative for AI tools?", "Pair any UI builder with a prompt-to-API endpoint. The endpoint holds your AI logic, so you're not locked into one internal-tools platform."],
      ["Do I need Retool to call an AI API?", "No. Any tool that can make an HTTP request — including spreadsheets and notebooks — can call a prompt-to-API endpoint."],
      ["How do I avoid platform lock-in?", "Keep AI behavior in a standalone endpoint rather than embedded in one tool, so you can switch UIs without rebuilding the logic."],
    ])}${cta}`,
  },
  {
    title: "Ship an AI Feature in a Weekend: The Indie Hacker's Guide",
    slug: "ship-ai-feature-in-a-weekend",
    category: "guides",
    tags: ["indie hacker", "ship ai feature", "weekend project", "ai api"],
    metaDescription:
      "A realistic weekend plan to ship an AI feature — from picking the right idea to a live endpoint and a working UI, without burning the whole weekend on setup.",
    content: `You have a weekend and want to ship a real AI feature. Here's a plan that ends with something live, not a pile of half-configured infrastructure.

## Friday night: pick one tight feature
Choose a single, well-scoped AI task: summarize, classify, extract, rewrite, or answer. Resist scope creep — one feature, shipped, beats five, half-built.

## Saturday morning: define the contract
Write the input and output. Make the output structured (JSON) so your UI can use it reliably. This is your prompt spec.

## Saturday afternoon: create the endpoint
Use prompt-to-API to publish the prompt as a live HTTPS endpoint. You now have a working backend without building one.

## Sunday morning: build the UI
A simple form that posts to your endpoint and renders the result. Keep it boring and functional.

## Sunday afternoon: guardrails + ship
Add input validation, rate limits, and error states. Deploy. Tell people. Done.

## Why this works
The slow part of shipping AI is usually the backend. Removing it turns a two-week project into a weekend one — and a shipped feature you can actually get feedback on.${faq([
      ["Can I really ship an AI feature in a weekend?", "Yes, if you scope to one task and skip building a backend. A prompt-to-API endpoint plus a simple UI is achievable in a weekend."],
      ["What AI feature should I build first?", "Pick one narrow task — summarize, classify, extract, or answer. Narrow scope is what makes a weekend ship realistic."],
      ["What slows most people down?", "Backend setup. Using a prompt-to-API endpoint removes that step so you spend the weekend on the feature, not the plumbing."],
    ])}${cta}`,
  },
  {
    title: "Free SEO Tools for Founders That Actually Move Rankings",
    slug: "free-seo-tools-for-founders",
    category: "guides",
    tags: ["free seo tools", "founders", "seo", "rankings"],
    metaDescription:
      "A founder-friendly roundup of free SEO tools that actually move rankings — what each one does and how to use them without a marketing budget.",
    content: `You don't need a big budget to do SEO that works. You need a few good free tools and the discipline to use them. Here's a practical roundup, plus how to use each.

## Technical checks
- **Meta + snippet previews**: make sure your titles and descriptions look right in search.
- **Schema/structured-data validators**: confirm your JSON-LD is valid so you're eligible for rich results and AI citations.
- **Sitemap and indexing checks**: verify search engines can find and crawl your pages.

## Keyword and content
- **SERP preview tools**: tune titles for click-through.
- **Question miners**: find the exact questions people ask, then answer them in FAQ sections.

## Speed and UX
- **Page speed tests**: slow pages lose rankings and visitors. Fix the worst offenders first.

## AI search readiness
- **llms.txt and schema**: structure content so ChatGPT and Perplexity can cite it — a growing traffic source.

## How to actually win
Pick your 10 most important pages. Run each through the checks above once a quarter. Fix titles, add FAQ sections and schema, speed them up, and interlink them. Consistency beats one-time blitzes.

Explore Svivva's [free tools](${SITE}/tools) to run several of these checks without signing up.${faq([
      ["What free SEO tools should founders use first?", "Start with snippet/meta previews, a schema validator, and a page-speed test on your 10 most important pages — those produce the fastest ranking gains."],
      ["Can I rank without paying for SEO software?", "Yes. Free tools plus disciplined on-page work (titles, FAQs, schema, internal links, speed) cover most of what early-stage SEO needs."],
      ["How often should I audit SEO?", "A quarterly pass on your top pages is enough for most small teams, plus publishing new content consistently."],
    ])}${cta}`,
  },
  {
    title: "How AI Search (ChatGPT, Perplexity) Changes SEO in 2026",
    slug: "how-ai-search-changes-seo-2026",
    category: "guides",
    tags: ["ai search", "seo 2026", "perplexity", "chatgpt search"],
    metaDescription:
      "AI search is reshaping SEO in 2026. Here's what changes, what stays the same, and exactly how to make your content citable by ChatGPT, Perplexity, and AI Overviews.",
    content: `A growing share of searches now end in an AI answer instead of a list of blue links. That changes how you get found — but not as much as the hype suggests. Here's what's real.

## What changes
- **Citations matter as much as rankings.** Being quoted in an AI answer drives traffic and trust, even without a #1 ranking.
- **Structure wins.** Tables, FAQs, and clear headings get extracted and cited far more than walls of text.
- **Facts and schema.** JSON-LD helps AI engines ingest your facts confidently.

## What stays the same
- **Quality and relevance** still decide whether you're cited or ranked.
- **Topical authority** — a deep, interlinked set of pages — still signals expertise.
- **Technical health** — crawlable, fast, indexable pages — is still table stakes.

## How to adapt this quarter
1. Add FAQ sections with direct answers to your key pages.
2. Add JSON-LD schema (Article, FAQ, Product).
3. Publish an llms.txt so AI crawlers know what to cite.
4. Build comparison tables — they're cited disproportionately.
5. Interlink related pages into clusters.

## The reassuring part
Almost everything that wins AI citations also helps classic SEO. You're not picking between Google and AI search — good structure serves both.${faq([
      ["Does AI search replace Google SEO?", "No. AI search adds a citation layer on top of classic search. The same well-structured, authoritative content wins in both."],
      ["How do I get cited by ChatGPT and Perplexity?", "Use clear headings, FAQ sections, comparison tables, and JSON-LD schema, and publish an llms.txt that tells AI crawlers what to prioritize."],
      ["What should I do first?", "Add FAQ sections and schema to your top pages and publish an llms.txt — those are the highest-leverage, fastest changes."],
    ])}${cta}`,
  },
  {
    title: "How to Build a REST API From a Spreadsheet (No Code)",
    slug: "build-rest-api-from-spreadsheet-no-code",
    category: "guides",
    tags: ["spreadsheet api", "no code api", "rest api", "build api"],
    metaDescription:
      "Turn a spreadsheet into a working REST API without code. A step-by-step guide for founders and ops teams who need an endpoint fast.",
    content: `Spreadsheets are where a lot of real business data lives. Turning one into a REST API lets your apps and automations read and act on it. Here's how — no code required.

## Step 1: Clean your sheet
Give every column a clear header, one record per row, consistent types. A tidy sheet makes a tidy API.

## Step 2: Decide what the API should do
Read-only lookups? Filtered queries? AI-powered answers over the data? Define the endpoints you need.

## Step 3: Create the endpoint
For simple reads, a sheet-to-API connector exposes rows over HTTP. For anything smart — summaries, classification, natural-language queries over the data — use a prompt-to-API endpoint that takes a question and returns an answer.

## Step 4: Call it from your app
\`\`\`bash
curl "https://your-endpoint.example/lookup?q=acme"
\`\`\`
Any tool that makes HTTP requests can now use your spreadsheet data.

## Step 5: Keep it in sync
Decide how fresh the data must be and refresh on that cadence. For most ops use cases, near-real-time is plenty.

## When to graduate to a database
If the sheet gets large, write-heavy, or multi-user, move the data to a database and point the same endpoints at it. Your consumers won't notice.${faq([
      ["Can I turn a spreadsheet into an API without code?", "Yes. Use a sheet-to-API connector for simple reads, or a prompt-to-API endpoint to answer natural-language questions over the data."],
      ["Is a spreadsheet API good enough for production?", "For low-volume, read-mostly ops use cases, yes. Graduate to a database once you have heavy writes or many concurrent users."],
      ["How do I keep the API data fresh?", "Refresh on a cadence that matches your needs — near-real-time covers most internal use cases."],
    ])}${cta}`,
  },
];

const seoPages = [
  {
    keyword: "ai api builder",
    slug: "ai-api-builder",
    title: "AI API Builder — Build a Callable AI Endpoint Fast | Svivva",
    headline: "Build an AI API in Minutes",
    subheadline: "Describe it. Deploy it. Call it from anywhere.",
    category: "seo-landing",
    metaDescription:
      "AI API builder: describe the behavior in plain English and deploy a callable AI endpoint in minutes — no backend, no DevOps, no SDK lock-in.",
    benefits: [
      "Go from idea to live AI endpoint in minutes",
      "No backend, hosting, or DevOps",
      "Iterate by editing the prompt, not redeploying",
    ],
    howItWorks:
      "Describe what the endpoint should do, define the output schema, and deploy. You get an HTTPS URL your app calls. Change behavior by editing the prompt — the contract stays stable.",
    whoItsFor:
      "Developers and founders who want AI features shipped fast without building or maintaining a backend.",
    content:
      "<p>An AI API builder collapses the slowest part of shipping AI: the backend. Instead of wiring a model, designing routes, and deploying a server, you describe the behavior and get a live endpoint. Keep your real inputs, outputs, and JSON responses — the difference is speed and zero ops.</p>",
  },
  {
    keyword: "no code api",
    slug: "no-code-api",
    title: "No-Code API — Create an Endpoint Without Writing Code | Svivva",
    headline: "Create an API Without Code",
    subheadline: "Describe what you need. Get a live endpoint.",
    category: "seo-landing",
    metaDescription:
      "No-code API: create a live, callable HTTPS endpoint without writing backend code. Perfect for founders, ops teams, and developers who want to move fast.",
    benefits: [
      "Build an endpoint with zero backend code",
      "Live HTTPS URL you can call from anywhere",
      "No servers to provision or maintain",
    ],
    howItWorks:
      "Describe the endpoint's job and output shape. Deploy. Call the resulting URL from any app, script, or automation.",
    whoItsFor:
      "Founders and ops teams who need an endpoint without engineering time, and developers who want to skip boilerplate.",
    content:
      "<p>A no-code API lets you create a working endpoint by describing what it should do, not by writing and hosting backend code. It's ideal for AI-powered features, internal tools, and quick integrations where engineering time is the bottleneck.</p>",
  },
  {
    keyword: "free api endpoint generator",
    slug: "free-api-endpoint-generator",
    title: "Free API Endpoint Generator — Spin Up an Endpoint | Svivva",
    headline: "Generate an API Endpoint Free",
    subheadline: "Spin up a callable endpoint to prototype with.",
    category: "seo-landing",
    metaDescription:
      "Free API endpoint generator: spin up a callable HTTPS endpoint to prototype your idea, then ship the real thing on Svivva.",
    benefits: [
      "Spin up an endpoint to prototype fast",
      "Test integrations before you commit",
      "Upgrade to a production endpoint when ready",
    ],
    howItWorks:
      "Describe the endpoint, generate it, and call the URL to prototype. When it's working, ship the production version on Svivva.",
    whoItsFor:
      "Builders prototyping integrations and developers who want a quick, callable endpoint to test against.",
    content:
      "<p>A free API endpoint generator is the fastest way to prototype an integration: spin up a callable endpoint, test your app against it, and iterate. When you're ready for production, deploy the real endpoint with validation and monitoring on Svivva.</p>",
  },
];

async function main() {
  console.log(`Publishing ${blogPosts.length} posts + ${seoPages.length} SEO pages to ${SITE}…\n`);
  const res = await fetch(`${SITE}/api/orbit/ingest-content`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-secret": SECRET },
    body: JSON.stringify({ blogPosts, seoPages }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`HTTP ${res.status}:`, JSON.stringify(json).slice(0, 800));
    process.exit(1);
  }
  console.log(`Created ${json.created?.length || 0} item(s):`);
  for (const c of json.created || []) console.log(`  · ${c.type}: ${c.url}`);
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
