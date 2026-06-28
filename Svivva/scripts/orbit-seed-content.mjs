#!/usr/bin/env node
/**
 * One-shot content batch: publishes agent-written (Opus) blog posts to Svivva
 * through /api/orbit/ingest-content, then pings IndexNow. Re-runnable (upserts
 * by slug). Reads SVIVVA_URL + ORBIT_INTERNAL_SECRET from .env.orbit / env.
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

const blogPosts = [
  {
    title: "How to Turn a Prompt Into a Working API (No Backend Required)",
    slug: "turn-a-prompt-into-an-api",
    category: "guides",
    tags: ["ai api", "prompt to api", "no code backend", "ai tools"],
    metaDescription:
      "Turn a plain-English prompt into a deployable API in minutes. A practical, step-by-step guide for developers and founders who want AI features without building a backend.",
    content: `If you can describe what you want in a sentence, you can ship an API for it. "Prompt-to-API" is the fastest way to go from an idea to a working endpoint your app can call — no server setup, no boilerplate, no DevOps.

This guide walks through exactly how it works and how to do it today.

## What "prompt-to-API" actually means

A traditional API takes weeks: you design routes, write handlers, wire up a model, add validation, deploy, and maintain it. Prompt-to-API collapses that into one step. You write a description of the behavior you want — "take a block of text and return a 3-bullet summary with a sentiment score" — and you get back a live HTTPS endpoint that does exactly that.

Under the hood you still get real inputs, outputs, and JSON responses. The difference is that the *definition* of the API is your prompt, not hundreds of lines of code.

## Step 1: Describe the job clearly

The quality of your endpoint depends on the clarity of your prompt. Be specific about three things:

- **Input**: what data goes in (e.g. "a product description string").
- **Output**: the exact shape you want back (e.g. "JSON with title, tagline, and 5 keywords").
- **Rules**: any constraints ("keywords must be lowercase, no duplicates").

A good prompt reads like a tiny spec, not a wish.

## Step 2: Generate and test the endpoint

Once you describe the job, you get a callable endpoint. Test it with a couple of real examples before you wire it into anything. Send a normal case, then send a weird one (empty input, very long input) to see how it behaves. This 2-minute check saves hours later.

## Step 3: Call it from your app

Your endpoint is just an HTTPS URL. From any language, it's a single request:

\`\`\`bash
curl -X POST https://your-endpoint.example/run \\
  -H "Content-Type: application/json" \\
  -d '{"text": "your input here"}'
\`\`\`

That's the whole integration. No SDK lock-in, no special runtime — if your code can make an HTTP request, it can use the API.

## Step 4: Iterate by editing the prompt

Need the output to change? Edit the prompt, not your codebase. This is the real superpower: product changes that used to require a backend deploy now take seconds, and your app code never changes because the endpoint contract stays the same.

## When to use it (and when not to)

Prompt-to-API is ideal for content generation, classification, extraction, summarization, and any "fuzzy" task where you'd otherwise glue an AI model into a server. For hard transactional logic (payments, auth), keep a traditional backend. Most teams end up using both: prompt-to-API for the AI features, normal code for the plumbing.

## Try it free

You don't need to take this on faith. [Svivva](${SITE}) lets you turn a prompt into a deployable API and gives you a set of [free AI tools](${SITE}/tools) to experiment with first. Start with a small endpoint, call it from your app, and you'll see how much backend work you just skipped.`,
  },
  {
    title: "How to Add AI to Your App Without Building a Backend",
    slug: "add-ai-to-your-app-without-a-backend",
    category: "guides",
    tags: ["add ai to app", "ai api", "no backend", "developers"],
    metaDescription:
      "Want AI features in your app but don't want to build and host a backend? Here's the fastest, lowest-maintenance way to add AI with a single API call.",
    content: `Adding AI to an app used to mean standing up a server, managing model keys, handling rate limits, and paying for infrastructure that sits idle most of the day. You can skip all of that. Here's the modern, low-maintenance approach.

## The problem with the "build a backend" approach

When most tutorials say "add AI," they really mean: create a server, install an SDK, store an API key, write an endpoint, deploy it, monitor it, and keep it patched. That's a lot of surface area for one feature. And the moment you want to tweak behavior, you're back in a deploy cycle.

For a single AI feature, that overhead rarely pays off.

## The shortcut: a hosted AI endpoint

Instead of hosting the logic yourself, you call a hosted endpoint that already runs the model for you. Your app sends input, gets structured output back, and you never touch a server. The benefits:

- **No infrastructure** to provision or pay for when idle.
- **No key management** inside your app bundle.
- **Instant changes** — behavior lives in a prompt/definition, not your deploy pipeline.

## Step 1: Pick the one feature to start with

Don't "add AI" in the abstract. Pick one concrete job: summarize support tickets, generate product descriptions, tag user feedback, draft replies. A narrow first feature is faster to ship and easier to measure.

## Step 2: Wire up a single request

From the frontend or your existing server, it's one HTTP call:

\`\`\`javascript
const res = await fetch("https://your-endpoint.example/run", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: userInput }),
});
const data = await res.json();
\`\`\`

If you already make API calls in your app, you already know how to do this.

## Step 3: Handle the output gracefully

Always design for the unhappy path: show a loading state, handle timeouts, and have a fallback message if the response is empty. AI features feel premium when they fail quietly and recover well.

## Step 4: Measure, then expand

Ship the one feature, watch how people use it, and only then add the next. Teams that add ten AI features at once usually ship zero good ones. One solid feature beats a pile of half-working ones.

## Cost stays predictable

Because you're calling an endpoint per request, your cost scales with actual usage instead of an always-on server. For early products, that's the difference between a few dollars and a monthly hosting bill.

## Get started

[Svivva](${SITE}) is built exactly for this: you define the AI behavior once and get a callable endpoint, so your app gets AI without a backend. Browse the [free AI tools](${SITE}/tools) to see the kinds of features you can ship in an afternoon.`,
  },
  {
    title: "Free AI Tools You Can Actually Use Without Signing Up",
    slug: "free-ai-tools-no-signup",
    category: "tools",
    tags: ["free ai tools", "no signup", "ai tools online", "indie hackers"],
    metaDescription:
      "A no-nonsense look at genuinely free AI tools you can use right now without creating an account — and how to tell the useful ones from the gimmicks.",
    content: `"Free AI tool" usually comes with an asterisk: free until you hit a wall, then a signup, then a credit card. This is a guide to the kind of tools you can open and use immediately — and how to spot the ones worth your time.

## Why no-signup matters

Every signup is friction and a privacy trade. For quick, one-off jobs — rewrite this paragraph, summarize this page, generate a few keywords — you shouldn't have to hand over an email first. No-signup tools respect that you just want the job done.

## What makes a free AI tool actually good

Not all free tools are worth using. The good ones share a few traits:

- **Instant**: they work in the browser with no install.
- **Focused**: they do one job well instead of ten jobs badly.
- **Honest about limits**: they tell you what's free and what isn't.
- **Fast**: results in seconds, not a spinner that times out.

If a "free" tool buries the work behind a paywall after one click, it's a lead magnet, not a tool.

## Categories worth bookmarking

Here are the everyday jobs where free AI tools genuinely save time:

1. **Writing helpers** — rewrites, summaries, tone changes.
2. **Developer utilities** — generating boilerplate, explaining code, formatting data.
3. **SEO + marketing** — keyword ideas, meta descriptions, titles.
4. **Security checks** — quick scans and analyzers for the security-curious.

## A quick test before you trust a tool

Run a small, known example through it. If you already know the right answer, you'll instantly see whether the tool is accurate or just confident. Do this once per tool and you'll quickly build a shortlist you actually rely on.

## Don't pay for what you don't need yet

For early projects, free tools cover a surprising amount of ground. Pay only when you hit a real, repeated limit — not because a popup asked nicely. Start free, prove the value, then upgrade with evidence.

## Where to start

[Svivva](${SITE}) hosts a collection of [free AI tools](${SITE}/tools) and [cyber-security mini-apps](${SITE}/cyber-security-mini-apps) you can use right away. Try a couple on a real task today and keep the ones that earn a spot in your workflow.`,
  },
  {
    title: "Prompt-to-API vs Building a Traditional Backend: Which Is Faster?",
    slug: "prompt-to-api-vs-traditional-backend",
    category: "guides",
    tags: ["prompt to api", "backend", "ai api", "build api fast"],
    metaDescription:
      "A side-by-side comparison of prompt-to-API and building a traditional backend — time, cost, maintenance, and when each one actually wins.",
    content: `If you need an API for an AI feature, you have two real choices: build a traditional backend, or use prompt-to-API. They sound similar but the trade-offs are very different. Here's an honest comparison so you can pick the right one.

## Speed to first working endpoint

- **Traditional backend**: hours to days. You scaffold a project, add a framework, write routes, wire in a model, handle errors, and deploy.
- **Prompt-to-API**: minutes. You describe the behavior and get a live endpoint.

For getting *something* in front of users, prompt-to-API wins clearly.

## Maintenance over time

This is where the gap widens. A traditional backend is yours forever: dependency updates, security patches, scaling, and on-call. Prompt-to-API has almost no maintenance — the behavior lives in a definition you can edit, and the hosting isn't your problem.

If you're a small team, every hour spent maintaining plumbing is an hour not spent on product.

## Cost

- **Traditional backend**: you pay for servers whether or not anyone uses the feature.
- **Prompt-to-API**: you pay per use, so an idle feature costs almost nothing.

Early on, per-use pricing is far friendlier to your runway.

## Control and flexibility

Traditional backends win when you need precise, deterministic logic — complex transactions, custom data joins, strict performance guarantees. Prompt-to-API wins for "fuzzy" AI jobs: summarizing, classifying, extracting, generating.

The honest answer is that most products want **both**: a normal backend for core logic, and prompt-to-API for the AI features bolted onto it.

## A simple decision rule

Ask one question: *"Is this feature mostly AI behavior, or mostly business logic?"*

- Mostly AI behavior → prompt-to-API.
- Mostly business logic → traditional backend.
- A mix → use prompt-to-API for the AI part and call it from your backend.

## The pragmatic path

Start with prompt-to-API to validate the feature fast. If it becomes a core, high-volume, deterministic part of your product later, you can always rebuild that specific piece as a traditional service. Don't pay the backend tax before you know the feature matters.

## Try the fast path first

[Svivva](${SITE}) lets you turn a prompt into a deployable API in minutes, and gives you [free AI tools](${SITE}/tools) to prototype with before you commit. Validate the idea today, and only build heavy infrastructure once it's earned.`,
  },
];

async function main() {
  console.log(`Publishing ${blogPosts.length} Opus-written posts to ${SITE}…\n`);
  const res = await fetch(`${SITE}/api/orbit/ingest-content`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-secret": SECRET },
    body: JSON.stringify({ blogPosts }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`HTTP ${res.status}:`, JSON.stringify(json).slice(0, 800));
    process.exit(1);
  }
  console.log(`Created ${json.created?.length || 0} item(s):`);
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
