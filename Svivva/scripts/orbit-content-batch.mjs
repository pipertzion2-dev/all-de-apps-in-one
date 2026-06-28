#!/usr/bin/env node
/**
 * Aggressive content batch #2 — Opus-written, FAQ-rich, high-intent pages built
 * for both Google and AI-search (GEO) citation. Publishes via ingest + IndexNow.
 * Re-runnable (upserts by slug).
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
  `\n\n## Frequently asked questions\n\n` +
  items.map(([q, a]) => `### ${q}\n\n${a}`).join("\n\n");
const cta = `\n\n---\n\n**Build it on Svivva.** Turn a prompt into a deployable API and use our [free AI tools](${SITE}/tools) to prototype first — no signup required to start. [Get started →](${SITE})`;

const blogPosts = [
  {
    title: "7 Best Ways to Add AI to Your App in 2026 (Ranked)",
    slug: "best-ways-to-add-ai-to-your-app-2026",
    category: "guides",
    tags: ["add ai to app", "ai api", "ai features", "2026"],
    metaDescription:
      "Seven practical ways to add AI to your app in 2026, ranked by speed and maintenance — from prompt-to-API to full custom backends. Pick the right one for your stage.",
    content: `Every product team is being asked to "add AI" this year. The hard part isn't the model — it's choosing an approach that ships fast and doesn't become a maintenance burden. Here are the seven realistic options in 2026, ranked from fastest to most involved.

## 1. Prompt-to-API (fastest)
Describe the behavior you want in plain English and get a live HTTPS endpoint your app calls. No server, no SDK lock-in, and you change behavior by editing the prompt instead of redeploying. Best for content generation, classification, extraction, and summarization.

## 2. Hosted AI endpoints / API gateways
Call a managed endpoint that runs the model for you. Slightly more setup than prompt-to-API but gives you routing and provider failover. Good when you need multiple models behind one interface.

## 3. A thin serverless function
Write one small function that wraps a model SDK. You own the code but skip a full backend. Reasonable for a single feature if you already have a serverless setup.

## 4. Backend-as-a-service + AI plugin
Use a BaaS (auth, db) and bolt on an AI plugin. Convenient if you're already on that platform, but you inherit its limits.

## 5. Workflow tools (Zapier/n8n-style)
Wire AI steps into automations. Great for internal ops and glue work, weaker for user-facing, low-latency features.

## 6. Self-hosted model + orchestration
Run your own model with a framework. Maximum control and privacy, maximum maintenance. Only worth it at real scale or with strict data requirements.

## 7. Full custom backend (most involved)
Design routes, handlers, model integration, scaling, and monitoring yourself. Right for core, deterministic, high-volume logic — overkill for a single AI feature.

## How to choose
Ask one question: is this feature mostly *AI behavior* or mostly *business logic*? AI behavior → options 1–2. Business logic → options 6–7. Most teams mix: prompt-to-API for the AI parts, a normal backend for the plumbing.${faq([
      ["What's the fastest way to add AI to an app?", "Prompt-to-API is the fastest — you describe the behavior and get a callable endpoint in minutes, with no backend to build or host."],
      ["Do I need machine learning experience?", "No. Modern approaches let you define behavior with a prompt and call an HTTPS endpoint. If your code can make an API request, you can add AI."],
      ["How much does it cost to add AI?", "With per-request endpoints you pay for actual usage, so an idle feature costs almost nothing — far cheaper than running an always-on server early on."],
    ])}${cta}`,
  },
  {
    title: "6 Postman Alternatives for Building and Shipping APIs Faster",
    slug: "postman-alternatives-build-apis-faster",
    category: "guides",
    tags: ["postman alternative", "api tools", "build api", "developers"],
    metaDescription:
      "Postman is great for testing APIs — but if you want to build and ship them faster, here are six alternatives and complements worth trying in 2026.",
    content: `Postman is the default for testing and documenting APIs. But testing isn't building. If your goal is to *create and ship* endpoints quickly — especially AI-powered ones — these six alternatives and complements are worth a look.

## 1. Prompt-to-API builders
Instead of hand-writing an endpoint and testing it in Postman, you describe what the endpoint should do and get a live URL. This collapses build + deploy into one step, then you can still test it anywhere.

## 2. Lightweight API frameworks
Minimal frameworks get you a running endpoint with very little boilerplate. Pair with a simple host and you're live fast.

## 3. API mocking tools
For frontend work, mock servers let you build against a contract before the real API exists. Great for parallel teams.

## 4. HTTP clients built into your editor
Many editors now have REST clients, so you test requests next to your code instead of switching apps. Lower friction than a separate tool for quick checks.

## 5. CLI-based request tools
For automation and CI, a scriptable command-line client beats a GUI. Reproducible, version-controllable, and easy to share.

## 6. Documentation-first platforms
Define the spec, and the docs + a test console generate themselves. Good when the API is a product others consume.

## The honest take
Keep Postman for deep testing if you like it — but for *getting an endpoint live*, a prompt-to-API builder removes the slowest step. Build the endpoint in minutes, then test it however you prefer.${faq([
      ["Is there a faster way to build APIs than Postman?", "Postman tests APIs; it doesn't build them. A prompt-to-API builder creates the live endpoint for you, which removes the slowest part of the workflow."],
      ["Can I still use Postman with these tools?", "Yes. Any endpoint you create has a normal HTTPS URL, so you can test it in Postman, your editor, or the command line."],
      ["What's the best Postman alternative for AI APIs?", "For AI features specifically, prompt-to-API is the strongest option because you define behavior in a prompt and get a callable endpoint without writing backend code."],
    ])}${cta}`,
  },
  {
    title: "Zapier vs a Custom API: Which Should You Use in 2026?",
    slug: "zapier-vs-custom-api",
    category: "guides",
    tags: ["zapier alternative", "custom api", "automation", "no code"],
    metaDescription:
      "Zapier vs building a custom API — a clear comparison of speed, cost, control, and when each one actually wins for your product or workflow.",
    content: `Both Zapier and a custom API can connect systems and add automation. They solve overlapping problems very differently. Here's an honest comparison so you pick the right tool.

## Speed to set up
- **Zapier**: minutes for simple connections using prebuilt integrations.
- **Custom API**: slower if hand-built — unless you use prompt-to-API, which gets you a live endpoint in minutes too.

## Cost as you grow
- **Zapier**: priced per task/run, which can climb fast at volume.
- **Custom API**: per-request hosting is usually cheaper at scale and gives you predictable costs.

## Control and flexibility
- **Zapier**: limited to what its integrations expose; complex logic gets awkward.
- **Custom API**: total control over inputs, outputs, and logic — your contract, your rules.

## Latency
- **Zapier**: fine for background automations, less ideal for instant, user-facing responses.
- **Custom API**: low-latency, suitable for in-app features.

## When Zapier wins
Internal ops, glue between SaaS tools, and one-off automations where engineering time matters more than cost or control.

## When a custom API wins
User-facing features, anything high-volume, and logic that needs to be precise, fast, or owned by you.

## The hybrid that usually wins
Use Zapier for internal glue and a custom API (built quickly via prompt-to-API) for the features your users actually touch. You don't have to choose one forever.${faq([
      ["Is a custom API cheaper than Zapier?", "Usually at scale, yes. Zapier charges per task, while a per-request API has predictable costs that stay low for idle features."],
      ["Can I build a custom API without a backend team?", "Yes — prompt-to-API lets you describe the endpoint and get a live URL without writing or hosting backend code."],
      ["Should I replace Zapier entirely?", "Often no. Keep Zapier for internal automations and use a custom API for user-facing, high-volume, or latency-sensitive features."],
    ])}${cta}`,
  },
  {
    title: "How to Turn a ChatGPT Prompt Into a Real API (Step by Step)",
    slug: "turn-chatgpt-prompt-into-real-api",
    category: "guides",
    tags: ["chatgpt api", "prompt to api", "ai api", "tutorial"],
    metaDescription:
      "A step-by-step guide to turning a ChatGPT-style prompt into a real, callable API that your app or other tools can use — no backend required.",
    content: `You've got a prompt that does something useful in ChatGPT. The next step is making it a real endpoint your app — or other people's apps — can call programmatically. Here's how.

## Step 1: Lock down the prompt
Rewrite your prompt as a tiny spec: define the exact input, the exact output shape (ideally JSON), and any rules. A clear contract is what turns a chat trick into a dependable API.

## Step 2: Decide the input and output
Pick the input your app will send (a string, an object) and the output it expects back. Keep outputs structured so your code can parse them reliably.

## Step 3: Create the endpoint
Use a prompt-to-API builder to publish the prompt as a live HTTPS endpoint. You get a URL that runs the prompt on every request and returns the structured result.

## Step 4: Call it from anywhere
\`\`\`bash
curl -X POST https://your-endpoint.example/run \\
  -H "Content-Type: application/json" \\
  -d '{"text": "your input"}'
\`\`\`
Any language that can make an HTTP request can now use your prompt.

## Step 5: Add guardrails
Validate inputs, set sensible limits, and handle empty or odd responses gracefully. This is what separates a demo from something you can ship.

## Step 6: Iterate by editing the prompt
Need different behavior? Change the prompt, not your app. The endpoint contract stays the same, so your integration never breaks.${faq([
      ["Can I turn a ChatGPT prompt into an API?", "Yes. With a prompt-to-API builder you publish the prompt as a live HTTPS endpoint that returns structured output on each request."],
      ["Do I need to write code?", "Only the single request that calls the endpoint. The endpoint itself is defined by your prompt, not by backend code."],
      ["How do I keep the output consistent?", "Specify the exact output shape (JSON) and rules in the prompt, and validate the response in your app before using it."],
    ])}${cta}`,
  },
  {
    title: "Free Cybersecurity Tools Every Indie Developer Should Bookmark (2026)",
    slug: "free-cybersecurity-tools-for-developers-2026",
    category: "security",
    tags: ["free security tools", "cybersecurity", "developers", "indie hackers"],
    metaDescription:
      "A curated list of genuinely free cybersecurity tools indie developers and founders should bookmark in 2026 — scanners, checkers, and hardening utilities.",
    content: `Security gets ignored until it can't be — and by then it's expensive. The good news: a lot of solid checks are free and take minutes. Here are the categories every indie developer should have bookmarked.

## 1. Password & credential checkers
Tools that tell you if a password or email shows up in known breaches. Run them before you reuse anything important.

## 2. Website header & TLS scanners
Quick scans that grade your security headers and certificate setup, with concrete fixes. A 2-minute check that catches embarrassing gaps.

## 3. Dependency vulnerability scanners
Your code is mostly other people's code. Scanners flag known-vulnerable packages so you can patch before someone exploits them.

## 4. Hash & encoding utilities
For verifying file integrity and debugging tokens — handy when you're shipping anything that touches auth.

## 5. DNS & domain inspectors
Confirm your DNS, SPF, and DMARC are set so your email lands and your domain isn't easy to spoof.

## 6. Privacy & exposure checks
See what your site leaks publicly — exposed endpoints, verbose errors, or stray debug routes.

## How to actually use these
Don't run them once. Put a 10-minute security pass on your calendar monthly. Most breaches exploit the boring stuff these tools catch.${faq([
      ["Are free cybersecurity tools good enough?", "For most indie products, yes — free scanners catch the common, high-impact issues. Pay for deeper tooling only once you have real scale or compliance needs."],
      ["What should I check first?", "Start with credential/breach checks, security headers, and dependency vulnerabilities — those cover the most common attack paths."],
      ["How often should I run security checks?", "A short monthly pass is enough for most small teams. Automate dependency scanning in CI so it runs on every change."],
    ])}${cta}`,
  },
  {
    title: "How to Check If Your Password Was Leaked (Free, No Signup)",
    slug: "check-if-password-was-leaked-free",
    category: "security",
    tags: ["password leak", "data breach", "security", "free tools"],
    metaDescription:
      "Worried your password was leaked? Here's how to check for free without signing up, what to do if it was, and how to stop it from happening again.",
    content: `Billions of credentials are floating around in breach dumps. If you reuse passwords, some of yours are probably in there. Here's how to check safely and for free — and what to do next.

## How leak checks work
Reputable checkers compare your password or email against known breach datasets without exposing your actual password (they use hashed, partial-match techniques). You learn whether it appears in a breach, not who else's did.

## Step 1: Check your email
Enter your email in a breach checker to see which services exposed your data. This tells you where to change passwords first.

## Step 2: Check specific passwords safely
Use a checker that hashes your input. If a password shows up, treat it as compromised everywhere you used it.

## Step 3: If you find a match
- Change that password immediately, everywhere it's reused.
- Turn on two-factor authentication on those accounts.
- Stop reusing passwords — that's what turns one breach into ten.

## Step 4: Prevent the next one
Use a password manager to generate unique passwords, enable 2FA, and check your email against breaches every few months.

## The one habit that matters most
Unique passwords per site. A single reused password is how one leaked database becomes a chain of compromised accounts.${faq([
      ["Is it safe to check a password in a leak tool?", "Yes, if the tool uses hashing/partial matching so your full password is never sent or stored. Avoid any tool that asks for your password in plain text alongside your username."],
      ["What should I do if my password was leaked?", "Change it everywhere it's used, enable two-factor authentication, and switch to unique passwords managed by a password manager."],
      ["How often should I check?", "Every few months, or any time you hear a service you use was breached."],
    ])}${cta}`,
  },
  {
    title: "Website Security Checklist for Founders: 10 Things to Do This Week",
    slug: "website-security-checklist-for-founders",
    category: "security",
    tags: ["website security", "founders", "checklist", "startup security"],
    metaDescription:
      "A practical 10-point website security checklist founders can complete this week — no security team required. Close the gaps attackers actually exploit.",
    content: `You don't need a security team to close the gaps that get small companies breached. Most attacks exploit basics. Here's a checklist you can finish this week.

## 1. Force HTTPS everywhere
Redirect all HTTP to HTTPS and enable HSTS. No exceptions.

## 2. Set security headers
Add Content-Security-Policy, X-Content-Type-Options, and Referrer-Policy. A header scan will grade you in seconds.

## 3. Lock down admin routes
Make sure dashboards and admin endpoints require auth and aren't indexed or guessable.

## 4. Patch your dependencies
Run a vulnerability scan and update anything flagged. Automate it in CI so it keeps happening.

## 5. Enable 2FA on everything
Your domain registrar, host, email, and code repo — all of it. These accounts are the keys to the kingdom.

## 6. Protect your DNS & email
Set SPF, DKIM, and DMARC so your email lands and your domain can't be spoofed.

## 7. Rate-limit and validate inputs
Throttle public endpoints and validate every input to blunt abuse and injection.

## 8. Don't leak secrets
Keep keys out of your client bundle and your git history. Rotate anything that slipped.

## 9. Back up and test restores
Backups you've never restored aren't backups. Test one.

## 10. Watch for breaches
Check your team emails against breach datasets and monitor for unusual logins.

## Make it recurring
Put a 30-minute security pass on the calendar monthly. Consistency beats intensity.${faq([
      ["What's the most important website security step?", "Force HTTPS, enable 2FA on critical accounts, and patch known-vulnerable dependencies — those three close the most common attack paths."],
      ["Do I need to hire a security expert?", "Not to cover the basics. This checklist handles the issues behind most small-company breaches; bring in experts as you scale or handle sensitive data."],
      ["How long does this take?", "Most founders can complete the core items in a few hours, then maintain them with a short monthly review."],
    ])}${cta}`,
  },
  {
    title: "How to Get Your SaaS Cited by ChatGPT and Perplexity (GEO Guide)",
    slug: "get-saas-cited-by-chatgpt-perplexity-geo",
    category: "guides",
    tags: ["generative engine optimization", "geo", "ai search", "seo 2026"],
    metaDescription:
      "AI search is sending real traffic in 2026. Here's a practical GEO guide to getting your SaaS cited by ChatGPT, Perplexity, and Google AI Overviews.",
    content: `Search is splitting in two: classic Google results, and AI answers from ChatGPT, Perplexity, and Google AI Overviews. Getting cited in those answers — Generative Engine Optimization (GEO) — is a fast-growing, free traffic source. Here's how to win citations.

## 1. Structure content for extraction
AI engines cite content they can parse cleanly. Use clear headings, short paragraphs, comparison tables, and explicit FAQ sections. Tables and FAQs get cited far more often than walls of text.

## 2. Add structured data (JSON-LD)
Mark up articles, FAQs, and products with schema. It helps AI crawlers ingest your facts confidently and increases your odds of being quoted.

## 3. Publish an llms.txt file
Add a /llms.txt manifest that tells AI crawlers what your site is and which pages to prioritize. It's the robots.txt of the AI era.

## 4. Answer real questions directly
Lead with the answer, then explain. AI engines extract the concise answer near a clear question heading — so write that answer on purpose.

## 5. Build topical depth
A cluster of related, interlinked pages signals authority. One deep topic beats scattered one-offs for both Google and AI engines.

## 6. Earn mentions, not just links
AI models weigh being talked about across the web. Helpful community posts, comparisons, and being listed in directories all increase the chance you're cited.

## 7. Keep it fresh
Update key pages and dates. Stale content gets cited less. A quarterly refresh of your best pages pays off.

## The shortcut
Write genuinely useful, well-structured pages with FAQs and schema, publish an llms.txt, and interlink everything. That's most of GEO — and it helps classic SEO at the same time.${faq([
      ["What is GEO (Generative Engine Optimization)?", "GEO is optimizing your content to be cited in AI answers from tools like ChatGPT, Perplexity, and Google AI Overviews — the AI-era complement to SEO."],
      ["How do I get cited by ChatGPT or Perplexity?", "Structure content for extraction (clear headings, tables, FAQs), add JSON-LD schema, publish an llms.txt, and build interlinked topical depth."],
      ["Does GEO replace SEO?", "No — they reinforce each other. Well-structured, schema-rich content ranks in Google and gets cited by AI engines at the same time."],
    ])}${cta}`,
  },
];

const seoPages = [
  {
    keyword: "prompt to api",
    slug: "prompt-to-api",
    title: "Prompt to API — Turn a Prompt Into a Live Endpoint | Svivva",
    headline: "Turn a Prompt Into a Live API",
    subheadline: "Describe what you want. Get a callable HTTPS endpoint. No backend.",
    category: "seo-landing",
    metaDescription:
      "Prompt to API: describe the behavior you want in plain English and get a deployable, callable API endpoint in minutes — no backend to build or host.",
    benefits: [
      "Ship an AI endpoint in minutes, not weeks",
      "No server, SDK lock-in, or DevOps",
      "Change behavior by editing the prompt, not redeploying",
    ],
    howItWorks:
      "Write your prompt as a tiny spec (input, output shape, rules). Publish it as an endpoint. Call it over HTTPS from any language. Iterate by editing the prompt — your integration contract stays stable.",
    whoItsFor:
      "Indie hackers, developers, and founders who want AI features fast without standing up and maintaining a backend.",
    content:
      "<p>Prompt-to-API collapses the slow part of shipping AI features. Instead of designing routes, wiring a model, and deploying a server, you describe the behavior you want and get a live HTTPS endpoint your app can call. You keep real inputs, outputs, and JSON responses — the difference is that the definition of the API is your prompt.</p><p>It's ideal for generation, classification, extraction, and summarization. For hard transactional logic, keep a traditional backend and call your prompt-to-API endpoints for the AI parts.</p>",
  },
  {
    keyword: "ai api cost calculator",
    slug: "ai-api-cost-calculator",
    title: "AI API Cost Calculator — Estimate Token Spend Free | Svivva",
    headline: "Estimate Your AI API Costs",
    subheadline: "Know your token spend before you ship.",
    category: "seo-landing",
    metaDescription:
      "Free AI API cost calculator: estimate token usage and monthly spend before you build, so AI features never blow up your budget.",
    benefits: [
      "Estimate token spend before you build",
      "Compare models and request volumes",
      "Avoid budget surprises in production",
    ],
    howItWorks:
      "Enter your expected request volume and average input/output size. See an estimated monthly cost so you can choose the right model and set sensible limits.",
    whoItsFor:
      "Builders adding AI features who want predictable costs and founders sizing a budget before committing.",
    content:
      "<p>AI features can be cheap or shockingly expensive depending on model choice and request size. Estimating token spend up front lets you pick the right model, cap usage, and avoid the classic surprise bill. Use the calculator to model real volumes before you commit, then build with confidence on Svivva.</p>",
  },
  {
    keyword: "json schema validator",
    slug: "json-schema-validator",
    title: "JSON Schema Validator — Validate JSON Online Free | Svivva",
    headline: "Validate JSON Against a Schema",
    subheadline: "Catch bad data before it ships an endpoint.",
    category: "seo-landing",
    metaDescription:
      "Free online JSON Schema validator: paste your JSON and schema to validate structure instantly before you ship an API endpoint.",
    benefits: [
      "Validate JSON against a schema instantly",
      "Catch structure errors before production",
      "No signup required",
    ],
    howItWorks:
      "Paste your JSON and your schema. Get instant validation with clear error messages pointing to exactly what's wrong.",
    whoItsFor:
      "Developers building or consuming APIs who need to confirm payloads match a contract before shipping.",
    content:
      "<p>Invalid payloads are a top cause of broken integrations. A JSON Schema validator confirms your data matches the contract before it reaches production, so you catch typos, missing fields, and wrong types early. Validate here, then deploy your endpoint on Svivva with confidence.</p>",
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
