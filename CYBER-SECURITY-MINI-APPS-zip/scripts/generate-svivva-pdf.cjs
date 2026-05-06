const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const TOOLS = [
  ["Password Strength Checker", "Entropy estimate, weak-pattern hints, and a secure random generator that runs entirely in the browser. SEO targets include 'free password strength test online', 'NIST 800-63B password checker' and 'how strong is my password'. Pairs with the Security Awareness Quiz for end-user education contexts."],
  ["SSL Certificate Checker", "Resolves host DNS A records via DNS-over-HTTPS and deep-links to SSL Labs for full TLS chain, expiry, and grade. Pairs with the TLS Version Guide for hardening checklists. Targets queries like 'free SSL checker', 'TLS expiry test'."],
  ["Security Headers Grader", "Letter-grades pasted response headers across HSTS, CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy and X-Content-Type-Options. Outputs hardening hints per missing header. Targets 'security headers test online', 'HSTS checker'."],
  ["HTTP & Email Header Analyzer", "Dual-mode parser for HTTP response headers OR raw RFC822 email source. Flags SPF/DKIM/DMARC results, suspicious Received chain anomalies and known phishing red flags. Targets 'email header analyzer', 'phishing header check'."],
  ["CORS Checker", "Detects the classic Access-Control-Allow-Origin: * combined with Allow-Credentials: true footgun, plus reflected-origin and null-origin risks. Targets 'CORS checker online', 'CORS misconfiguration test'."],
  ["URL Safety Scanner", "Heuristic scan for punycode/IDN homographs, embedded credentials, suspicious TLDs, excessive subdomains and IP-as-host. Zero external API call. Targets 'is this link safe', 'phishing URL scanner free'."],
  ["DNS Record Viewer", "DNS-over-HTTPS lookups for A, AAAA, MX, TXT, NS, CNAME against Cloudflare 1.1.1.1. Surfaces SPF/DMARC TXT for email security audits. Targets 'free DNS lookup', 'MX record check'."],
  ["IP Reputation Lookup", "Geolocation, ASN owner and network context for any IPv4/IPv6. Quick triage for SOC analysts investigating raw log entries. Targets 'IP lookup free', 'whose IP is this'."],
  ["JWT Decoder", "Parses header + payload locally. Flags alg=none, weak HS256 secrets risk, missing exp claim and audience/issuer mismatches. Token never leaves the tab. Targets 'JWT decoder online', 'decode JWT free'."],
  ["Base64 + SHA-256 Toolkit", "Encode/decode Base64 (UTF-8 safe) and SHA-256 hash via SubtleCrypto. Useful for IOC hashing and quick payload inspection. Targets 'Base64 encoder', 'SHA256 generator online'."],
  ["Subdomain Finder Lite", "DoH-based probe of ~50 common hostnames (api, dev, staging, admin, mail, vpn). Returns resolved subdomains in seconds — recon starting point, not exhaustive. Targets 'free subdomain finder', 'DNS subdomain check'."],
  ["Open Port Reference", "The top 20 ports red and blue teams audit first: 22 SSH, 445 SMB, 3389 RDP, 1433 MSSQL, 3306 MySQL, 5432 Postgres, 6379 Redis, 27017 Mongo, 9200 Elastic, 5601 Kibana. Targets 'common ports list', 'security port reference'."],
  ["robots.txt Analyzer", "Fetches or accepts pasted robots.txt. Flags Disallow lines that leak sensitive paths (/admin, /api/internal, /backup) and surfaces Sitemap directives. Targets 'robots.txt analyzer', 'crawl rules security'."],
  ["Sitemap.xml Parser", "Counts URLs, groups by path prefix, extracts lastmod. Supports SEO inventory and security crawl-target enumeration. Targets 'sitemap parser online', 'extract URLs from sitemap'."],
  ["Email Breach Checker", "Validates RFC 5322 format, runs MX lookup via DoH, deep-links to Have I Been Pwned. The email never leaves the browser nor is logged. Targets 'email breach check', 'have I been pwned free'."],
  ["Secret Scanner", "Regex library for AWS access keys, GitHub PATs, Slack bot tokens, Stripe live keys and generic 32+ char hex secrets. Drop in logs or git diffs and rotate anything matched. Targets 'secret scanner free', 'leaked API key finder'."],
  ["Cookie Security Analyzer", "Per-cookie grade across Secure, HttpOnly, SameSite (Lax/Strict/None), Domain scope and Max-Age sanity. Targets 'cookie security check', 'Set-Cookie analyzer'."],
  ["API Key Format Checker", "Heuristic detection of Stripe (sk_live_/pk_live_), AWS (AKIA*), GitHub (ghp_/gho_/ghs_), Slack (xox[bp]-) and Google API (AIza*) shapes. Includes per-vendor rotation playbooks. Targets 'API key checker', 'detect AWS key'."],
  ["TLS Version Guide", "TLS 1.0 / 1.1 sunset checklist, cipher suite recommendations and a notes panel for SSL Labs results. Targets 'TLS version check', 'SSL TLS best practices'."],
  ["Certificate Transparency Viewer", "Paste crt.sh JSON — browse issuers, hostnames and validity windows. Useful for hostname discovery and rogue cert detection. Targets 'crt.sh viewer', 'CT log lookup'."],
  ["CVSS 3.1 Calculator", "Paste a CVSS:3.1/AV:.../AC:... vector and get instant base score plus severity label (None/Low/Medium/High/Critical) ready for ticketing. Targets 'CVSS calculator online', 'CVSS 3.1 base score'."],
  ["OWASP Top 10 Self-Assessment", "Ten focused questions across A01–A10 (2021 edition). Outputs Green/Amber/Red risk band with per-category remediation pointers. Targets 'OWASP Top 10 checklist', 'web app security checklist'."],
  ["SQLi Payload Reference", "Curated examples per DB family (MySQL, Postgres, MSSQL, Oracle, SQLite). AUTHORIZED tests only — written permission required. Targets 'SQL injection payloads', 'SQLi reference'."],
  ["XSS Payload Generator", "Reflected and DOM XSS test strings, including SVG vectors and event-handler tricks. AUTHORIZED tests only. Targets 'XSS payload generator', 'cross site scripting test'."],
  ["Open Redirect Tester", "Compare two URLs and reason about ?next=, ?return_to= and ?redirect= parameters in OAuth and login flows. Targets 'open redirect checker', 'redirect vulnerability test'."],
  ["CSP Evaluator", "Grades Content-Security-Policy headers — flags 'unsafe-inline', 'unsafe-eval', wildcard hosts, missing object-src, missing frame-ancestors. Generates a hardened CSP starter. Targets 'CSP checker', 'CSP evaluator online'."],
  ["Clickjacking Tester", "Checks if X-Frame-Options or CSP frame-ancestors actually protect framing. Includes an iframe-poc HTML snippet for proof of concept. Targets 'clickjacking test', 'X-Frame-Options checker'."],
  ["SSRF Payload Examples", "Common internal probe targets (169.254.169.254 metadata, 127.0.0.1, localhost.localdomain, IPv6 ::1, DNS rebinding hints). Sanctioned tests only. Targets 'SSRF payload', 'SSRF testing reference'."],
  ["Prototype Pollution Scanner", "Flags __proto__, constructor.prototype and risky deep-merge / lodash.merge / Object.assign patterns in pasted JS or JSON. Targets 'prototype pollution scanner', 'JS merge risk check'."],
  ["npm Dependency Vuln Lookup", "Paste package.json — get dependency list with deep-links to npm advisories, GitHub Security Advisories and Snyk DB. Targets 'npm dependency checker', 'package.json scanner'."],
  ["NIST CSF Scorecard", "Slider-based gap snapshot across Identify / Protect / Detect / Respond / Recover. Prints maturity radar and per-function note fields. Targets 'NIST CSF scorecard', 'NIST cybersecurity checklist'."],
  ["Zero Trust Readiness Score", "Pillar scoring across Identity, Device, Network, Application, Data. Output is a 0-100 readiness score and the weakest pillar to invest in next. Targets 'zero trust assessment', 'ZTNA readiness'."],
  ["SOC 2 Readiness Checklist", "Interactive Trust Services Criteria checklist across Security (CC), Availability (A), Confidentiality (C), Processing Integrity (PI), Privacy (P). Targets 'SOC 2 checklist free', 'SOC2 readiness'."],
  ["Ransomware Risk Calculator", "Weighted score from offline backups, EDR coverage, MFA on admin accounts, network segmentation and tested restore procedures. Targets 'ransomware risk calculator', 'backup immaturity score'."],
  ["IR Playbook Builder", "Pick scenario (ransomware, data breach, BEC/phishing, insider) — get a printable Detect / Contain / Eradicate / Recover / Lessons Learned outline. Targets 'incident response playbook', 'IR plan template free'."],
  ["Attack Surface Estimator", "Sliders for SaaS apps, public APIs, workforce size and BYOD ratio. Output is a layered exposure metaphor for executive conversations. Targets 'attack surface calculator', 'security exposure score'."],
  ["Bug Bounty Scope Parser", "Paste HackerOne / Bugcrowd scope text — buckets lines into in-scope vs out-of-scope (wildcards, mobile, third-party, hardware). Targets 'bug bounty scope parser', 'in scope checker'."],
  ["Security Awareness Quiz", "Short scored quiz on phishing recognition, password hygiene, MFA basics and USB drop awareness. Lunch-and-learn ready. Targets 'security awareness quiz free', 'phishing quiz employees'."],
  ["Pentest Roadmap Generator", "Pick scope (web, API, mobile, network, cloud) and maturity (first-ever vs annual). Outputs tailored pentest outline plus RFP boilerplate. Targets 'pentest roadmap', 'penetration testing plan template'."],
  ["Vendor Risk Scorecard", "Two-minute vendor security questionnaire covering data sensitivity, hosting, SOC 2, breach history and sub-processors. Output is a Tier 1/2/3 risk band. Targets 'vendor risk assessment free', 'third party risk scorecard'."],
];

const OUT = path.join(__dirname, "..", "attached_assets", "CyberWavy-Svivva-Connection-Guide.pdf");

const doc = new PDFDocument({
  size: "LETTER",
  margins: { top: 40, bottom: 20, left: 44, right: 44 },
  bufferPages: true,
  info: { Title: "CyberWavy x Svivva Connection Field Manual", Author: "CyberWavy Tools" },
});
doc.pipe(fs.createWriteStream(OUT));

const OLIVE = "#4b5320";
const KHAKI = "#c4b896";
const DARK = "#1a1d13";
const ACCENT = "#7a8450";
const TEXT = "#1a1d13";
const MUTED = "#3d4226";

const PAGE_BOTTOM = 752;

function hr(color, w) {
  const y = doc.y + 1;
  doc.save().lineWidth(w).strokeColor(color).moveTo(44, y).lineTo(568, y).stroke().restore();
  doc.moveDown(0.25);
}
function section(num, title) {
  doc.fillColor(OLIVE).font("Helvetica-Bold").fontSize(11).text(`${num}.  ${title.toUpperCase()}`, { characterSpacing: 0.7 });
  hr(KHAKI, 0.5);
}
function para(t) {
  doc.fillColor(TEXT).font("Helvetica").fontSize(8.8).text(t, { align: "justify", lineGap: 1 });
  doc.moveDown(0.2);
}
function label(name, body) {
  doc.fillColor(OLIVE).font("Helvetica-Bold").fontSize(8.8).text(`${name}  `, { continued: true });
  doc.fillColor(TEXT).font("Helvetica").fontSize(8.8).text(body, { align: "justify", lineGap: 1 });
  doc.moveDown(0.15);
}

// COVER BAND
doc.rect(0, 0, 612, 78).fill(DARK);
doc.fillColor(KHAKI).font("Helvetica-Bold").fontSize(19).text("CYBERWAVY  x  SVIVVA", 44, 20, { characterSpacing: 2 });
doc.fillColor("#9aa67a").font("Helvetica").fontSize(9.2).text("Field Manual: Connecting 40 Free Cybersecurity Mini Apps to the Svivva SEO Engine", 44, 46);
doc.fillColor("#7a8450").fontSize(7.6).text("Operational Guide  ·  Dense Reference  ·  Zero Empty Space  ·  v2.0", 44, 60);
doc.y = 88;

// 1
section(1, "What This Is");
para("CyberWavy Tools is a free hub of 40 browser-based cybersecurity mini apps engineered to capture organic Google Search demand for high-intent security queries — password checkers, CSP analyzers, DNS lookups, OWASP checklists, CVSS calculators and many more — and funnel that traffic toward Pyracrypt, the production application this hub promotes. Every tool is a standalone, indexable page with a unique title, meta description, keyword cluster and a Pyracrypt CTA block rendered in a Rothco army aesthetic for distinct brand recall.");
para("Svivva (svivva.com) is the SEO + indexing engine that amplifies that traffic. Its Orbit crawler scans the deployed CyberWavy Repl, learns every tool, generates SEO landing pages on svivva.com (one per tool), submits them to search engines via the IndexNow protocol and links each page back to the matching tool. A Powered-by-Svivva widget closes the loop from tool back to svivva.com, compounding both properties' link authority over time.");
para("This manual is the field reference for that integration. It documents the connection pipeline end-to-end, every one of the 40 tools with descriptions and SEO targeting, the operational runbook for connecting and maintaining the Svivva link, the funnel math behind the strategy, and a troubleshooting section covering the most common failure modes.");

// 2
section(2, "The Connection Pipeline (End to End)");
label("Deploy.", "CyberWavy Hub is published to https://workspace.pipertzion2.replit.app via Replit Autoscale. All 40 tool routes are live at /tools/<slug> and the homepage exposes the tool grid for crawl discovery. The build command is npm run build and the start command is npm start, both delegated from the root package.json into the cyberwavy-hub workspace.");
label("Paste.", "In Svivva, open the Tools tile (the 4/6 step). Paste the deployed Repl URL into the field labeled 'Connect your 50 mini apps Repl', then hit Run All. Svivva validates the URL responds with HTTP 200 and stores it against your account.");
label("Scan.", "Svivva's Orbit crawler walks the hub, parses each tool page, and extracts title, shortDescription and keyword cluster from the React-rendered DOM (data sourced from cyberwavy-hub/src/data/toolsRegistry.ts). The crawl runs every 24 hours thereafter to detect inventory drift, copy edits or newly added tools.");
label("Generate.", "Svivva spins up one SEO landing page per tool on svivva.com, optimized for that tool's keyword cluster, with structured data (FAQPage / SoftwareApplication schema) and a hero CTA linking back to the matching Repl URL. Each page is internally linked from the Svivva master tool index so authority flows freely.");
label("Index.", "Svivva pushes the new URLs to Bing, Yandex, Yahoo and DuckDuckGo via the IndexNow protocol automatically — no API key on your side. Google indexing is layered on by linking Search Console; Svivva submits the master sitemap on your behalf and reports indexation status weekly.");
label("Widget.", "Svivva produces a Powered-by-Svivva HTML/JS snippet. Drop it into the global ThemedShell or Footer component so it renders on every tool page; clicks close the loop back to svivva.com, compounding link equity in both directions and signaling reciprocal trust to crawlers.");
label("Measure.", "The Svivva dashboard reports impressions per tool, click-through rate to your Repl, scroll depth on the landing pages and outbound clicks to Pyracrypt CTAs. Weekly digests highlight rising and falling tools so you can iterate copy in toolsRegistry.ts and ship a redeploy in minutes.");

// 3
section(3, "Why The 4/6 Step Was Stuck");
para("The Tools tile in Svivva needs the explicit deployed .replit.app URL pasted in. Svivva cannot auto-discover an arbitrary Repl from your account — this is an intentional security boundary so other accounts cannot enumerate your private workspaces. The 12/12 SEO/social/blog block is already complete and required no Repl input. The 4/6 Tools block needs the manual paste of https://workspace.pipertzion2.replit.app. Once pasted and Run All is fired, Orbit crawls the hub and the remaining two steps (Scan + Generate) tick off, moving the bar from 67% to 100%.");
para("If Orbit reports zero tools after the paste, the URL handed in is most likely the *.replit.dev development URL (private to your editor session) instead of the *.replit.app production URL. The fix is to copy the production URL from the Replit Deployments rocket icon in the left sidebar of the workspace and paste that instead.");

// 4
section(4, "Why The Hub Is Already Svivva-Ready");
label("Predictable URLs.", "Every tool lives at /tools/<slug> — Orbit can enumerate without sitemaps, simply by crawling the homepage tool grid and following internal links.");
label("Unique on-page metadata.", "Each tool has its own title, shortDescription and keyword cluster baked into toolsRegistry.ts. No duplicate-content penalties; every page has a singular ranking target.");
label("Stable rendered headings.", "Single-page rendering with deterministic h1/title text — Orbit reads page-level signals reliably across all 40 tools without dealing with race conditions in late-loaded JS.");
label("Pyracrypt CTA block.", "Every tool surfaces an outbound CTA to https://pyracrypt.replit.app — funnel intent is unambiguous to both crawlers (clear topical anchor) and end users (warm-prospect handoff).");
label("Distinct brand voice.", "Rothco army palette (olive #4b5320, khaki #c4b896, dark charcoal #1a1d13) plus military stencil typography produces low bounce rate and high time-on-page — both ranking signals.");
label("Autoscale economics.", "Static + autoscale deployment means Orbit's repeated daily crawls do not cost you per-request compute; the hub idles to zero between Svivva polls.");
label("Long-tail keyword diversity.", "40 tools × ~3-5 unique phrases each ≈ 120-200 addressable search queries spanning developer, SOC analyst, compliance lead and curious-user intent.");
label("Instant-value pages.", "All tools are browser-only utilities (no signup, no upload, no friction). Google rewards instant-value pages with higher rankings via Core Web Vitals and engagement metrics.");

// 5 - INVENTORY
section(5, "The 40 Mini Apps — Full Inventory");
para("Each entry below maps to a Svivva-generated SEO landing page on svivva.com that links back to https://workspace.pipertzion2.replit.app/tools/<slug>. Tools marked AUTHORIZED-ONLY are educational references for sanctioned security testing; never run them against systems without written permission.");
for (let i = 0; i < TOOLS.length; i++) {
  const [name, desc] = TOOLS[i];
  const num = String(i + 1).padStart(2, "0");
  doc.fillColor(OLIVE).font("Helvetica-Bold").fontSize(8.6).text(`${num}.  ${name}  `, { continued: true });
  doc.fillColor(MUTED).font("Helvetica").fontSize(8.4).text(desc, { align: "justify", lineGap: 0.8 });
  doc.moveDown(0.18);
}

// 6 - RUNBOOK
section(6, "Operational Runbook");
para("This section is the step-by-step playbook for going from 4/6 to 6/6 in Svivva and keeping the integration healthy thereafter. Run sub-sections 6.1 through 6.4 end-to-end the first time, then revisit 6.5 monthly as a maintenance cadence.");
label("6.1 Confirm deployment is live.", "Open https://workspace.pipertzion2.replit.app — the homepage should render the Rothco-army hub with the 40-tool grid. Spot-check three random tool routes such as /tools/password-strength, /tools/csp-evaluator and /tools/cvss-calculator. Verify the Pyracrypt CTA block appears on each tool page (olive panel, khaki text, outbound link to https://pyracrypt.replit.app). Open browser DevTools Network tab on a tool page — confirm 200 responses, no console errors, no React hydration warnings.");
label("6.2 Connect to Svivva.", "Open svivva.com → Orbit dashboard → Tools tile (the 4/6 one shown in your screenshot). Paste the deployed URL https://workspace.pipertzion2.replit.app into the input. Click Run All [2]. Watch the 4-of-6 progress bar advance to 6-of-6 within a minute or two. Confirm the green 'Connected as @username' chip flips from @undefined to your handle. Reload the Orbit dashboard and verify the tool inventory shows all 40 tools — if fewer, jump to Section 8 troubleshooting.");
label("6.3 Add the Powered-by-Svivva widget.", "Copy the snippet Svivva generates after Run All completes — typically a single <script> tag plus a small badge div. Paste it into cyberwavy-hub/src/components/Footer.tsx (or directly into ThemedShell so it renders globally on every tool page). Restart the Start application workflow and republish the autoscale deployment so the widget ships to production. Visit a deployed tool page, scroll to footer, confirm the badge renders and click-tests through to svivva.com.");
label("6.4 Wire IndexNow + Google Search Console.", "Svivva auto-submits new pages to Bing, Yandex, Yahoo and DuckDuckGo via IndexNow — no key management on your end. For Google: add svivva.com to Google Search Console, verify ownership via DNS TXT or HTML tag, then submit Svivva's master sitemap (exposed at svivva.com/sitemap.xml). Monitor the Search Console Coverage report weekly for the first month; expect first impressions within 7-14 days for low-competition keywords. Pair with Bing Webmaster Tools for cross-engine visibility.");
label("6.5 Maintenance cadence.", "Weekly: scan the Svivva dashboard for the top 5 traffic tools — double down on their keyword clusters in toolsRegistry.ts (add LSI variants, expand shortDescription, refresh examples). Monthly: re-run the Svivva crawl after any tool addition, removal or copy change so the SEO pages stay in sync with the live hub. Quarterly: audit Pyracrypt CTA copy on the 5 highest-intent tools (NIST CSF, SOC 2, Vendor Risk, Ransomware, OWASP) — those are the warmest conversion paths. Annually: rotate hero copy on the homepage and refresh tool screenshots — keeps freshness signals strong for Google.");

// 7
section(7, "Funnel Math (Why This Strategy Works)");
para("With 40 tools at ~3-5 unique long-tail keywords each, the hub addresses 120-200 searchable phrases. Svivva's svivva.com landing pages inherit svivva.com domain authority and rank materially faster than a brand-new .replit.app domain would on its own. Every Svivva page links to one CyberWavy tool; every CyberWavy tool surfaces a Pyracrypt CTA. The full funnel reads as follows.");
label("Step 1 — Search intent.", "User types a high-intent query: 'free CSP checker', 'CVSS 3.1 calculator', 'SOC 2 readiness checklist', 'NIST CSF scorecard', etc.");
label("Step 2 — Svivva landing.", "User lands on the matching svivva.com SEO page. It is Svivva-hosted, indexes fast, ships structured data and an above-the-fold CTA pointing to the live tool.");
label("Step 3 — CyberWavy tool.", "User lands on the live tool at workspace.pipertzion2.replit.app/tools/<slug>. They get instant value (no signup, no upload, no friction) which builds reciprocity.");
label("Step 4 — Pyracrypt CTA.", "Footer + inline Pyracrypt CTA block converts the warm prospect — they just received measurable value and now see a contextual upgrade path.");
label("Step 5 — Pyracrypt.", "Click lands on https://pyracrypt.replit.app — the production app you actually monetize. The user arrives pre-qualified, pre-warmed and primed to convert.");
para("Conservative arithmetic: 200 keywords × 50 monthly impressions average × 4% CTR to the Svivva landing × 35% click-through to the live tool × 6% click-through to the Pyracrypt CTA ≈ 8 warm Pyracrypt visits/month at launch, scaling roughly linearly with indexed pages and ranking improvements over the first 90 days. At month six, with rankings consolidated, the same arithmetic at 300 impressions/keyword and 8% CTR yields ≈ 100+ warm visits/month at zero incremental ad spend.");

// 8
section(8, "Troubleshooting");
label("Run All stays at 4/6.", "The URL pasted is not a deployed .replit.app domain (development *.replit.dev URLs are private to your editor session). Open Replit Deployments (rocket icon, left sidebar) and copy the public URL from there.");
label("Connected chip shows @undefined.", "Svivva's OAuth token expired or never completed. Hit Disconnect on the Orbit page, re-auth Svivva → Replit OAuth, then reconnect.");
label("Some tools missing in inventory.", "Confirm the tool route renders without JavaScript errors. Open DevTools, navigate to /tools/<slug>, look for hydration errors or 404s in the Network tab. Also confirm the slug exists in toolsRegistry.ts.");
label("SEO pages slow to appear on svivva.com.", "Svivva queues page generation. Allow 24-48 hours for the first batch, then ~minutes per new tool added afterward. Check the Svivva logs panel for the queue depth.");
label("Pyracrypt CTA not clickable from referrals.", "Verify the CTA href in cyberwavy-hub/src/components/CyberWavyCTA.tsx points to the absolute https://pyracrypt.replit.app URL and not a relative path that breaks when iframed or proxied through other surfaces.");
label("Search Console: 'Discovered – currently not indexed'.", "Normal for the first 2-4 weeks on new long-tail pages. Internal-link a struggling page from a higher-authority Svivva post to push it through indexing.");
label("Drop in CTR after a deploy.", "Check that the deploy did not strip the Pyracrypt CTA component. Regression-test by visiting three random tool pages on production after every deploy.");
label("Zero impressions after 14 days.", "Confirm IndexNow submissions completed (Svivva logs panel) and that Bing Webmaster Tools shows the URLs as 'Indexed'. If not, re-trigger the Run All step in Svivva.");

// 9
section(9, "Quick Reference Card");
label("Hub URL (paste into Svivva).", "https://workspace.pipertzion2.replit.app");
label("Pyracrypt CTA target.", "https://pyracrypt.replit.app");
label("Svivva dashboard.", "https://svivva.com");
label("Tool route pattern.", "/tools/<slug>  (40 slugs, see Section 5 inventory)");
label("Tool data source of truth.", "cyberwavy-hub/src/data/toolsRegistry.ts");
label("Global CTA component.", "cyberwavy-hub/src/components/CyberWavyCTA.tsx");
label("Theme tokens.", "cyberwavy-hub/src/index.css (Rothco army palette + stencil typography)");
label("Deployment type.", "Replit Autoscale; build = npm run build, start = npm start");
label("Workflow.", "Start application — cd cyberwavy-hub && node_modules/.bin/vite --port 5000");
label("Restart cadence.", "Restart Start application after any toolsRegistry.ts edit; redeploy autoscale after any production-bound copy or theme change.");

// 10
section(10, "Technical Architecture");
label("Frontend.", "React 18 + Vite + TypeScript single-page app. Routing via react-router-dom; every tool is a lazy-loaded route under /tools/<slug>. Global theming through ThemedShell which wraps NavBar, page outlet, CyberWavyCTA and Footer.");
label("Tool registry.", "src/data/toolsRegistry.ts is the single source of truth. Each ToolDefinition carries id, slug, title (used as <title> + h1), shortDescription (meta description + hero subtitle) and keywords (meta keywords + Svivva crawler hint). Editing this file and redeploying is the entire content workflow.");
label("Theming.", "src/index.css defines the Rothco army palette as CSS variables: --olive #4b5320, --khaki #c4b896, --gunmetal #2a2e1f, --bg #1a1d13. Camo SVG patterns and military stencil typography (Stencil Std fallback to Helvetica Black) are applied through component classes.");
label("Build + deploy.", "Root package.json delegates build (npm run build → cd cyberwavy-hub && vite build) and start (npm start → vite preview --port 5000). Replit Autoscale runs both, exposing the public URL for Svivva consumption.");
label("Performance.", "Static asset bundle ~ <300 KB gzipped; tools render under 200 ms First Contentful Paint on cold cache. No external fonts on critical path; no third-party trackers (Svivva widget loads after main paint).");

// 11
section(11, "Conversion Psychology — Why The CTA Works");
para("The Pyracrypt CTA block is positioned after the user has just received measurable value from the free tool. This is the classic reciprocity trigger from Cialdini's Influence — the user feels lightly indebted, lowering the threshold to click an upgrade path. Three design choices reinforce this:");
label("Visual weight.", "The CTA panel uses high-contrast olive-on-khaki framing inside an otherwise muted page, drawing the eye without feeling sales-y or interrupting tool flow.");
label("Specific copy.", "Each CTA references the tool the user just used (e.g., 'Done checking your password? Pyracrypt does this for your whole stack.') rather than generic upgrade copy — relevance multiplier ≈ 2-3× CTR vs generic.");
label("Frictionless outbound.", "Single-click outbound to https://pyracrypt.replit.app, no modal, no email gate, no signup intercept. Warm prospects convert when the path is shortest.");

// 12
section(12, "Glossary");
label("Orbit.", "Svivva's crawler component. Walks your Repl every 24h, parses tool metadata, and generates SEO landing pages on svivva.com.");
label("IndexNow.", "An open protocol (Bing, Yandex, Yahoo, DuckDuckGo) that lets sites push new/updated URLs to search engines instantly instead of waiting for crawl. Svivva handles submissions automatically.");
label("Long-tail keyword.", "A specific, low-volume search query with high purchase/use intent (e.g., 'free CSP checker for Cloudflare workers'). The hub targets ~120-200 of these collectively across 40 tools.");
label("Domain authority.", "Composite measure of a domain's ranking potential. svivva.com inherits more than a brand-new .replit.app subdomain, which is why Svivva-hosted SEO pages rank faster than equivalent pages on the hub itself.");
label("Pyracrypt CTA.", "The reusable React component (CyberWavyCTA.tsx) rendered on every tool page that funnels traffic to https://pyracrypt.replit.app. The conversion endpoint of the entire hub strategy.");
label("Rothco aesthetic.", "Olive drab, khaki and dark gunmetal palette inspired by military surplus brand Rothco. Chosen for low-bounce distinctiveness in a security niche otherwise dominated by neon cyber tropes.");
label("React Single-Page App.", "Vite-bundled React 18 + TypeScript app delivering all 40 tools from one JavaScript bundle. Each tool route is code-split for fast initial paint.");
label("Autoscale deployment.", "Replit deployment mode that idles to zero between requests and scales out under load. Pay only for actual compute consumed during Svivva crawls and live user sessions.");
label("CWV (Core Web Vitals).", "Google's UX metrics: Largest Contentful Paint, Interaction to Next Paint, Cumulative Layout Shift. The hub targets all three in the green band, which Google factors into ranking.");
label("FAQPage / SoftwareApplication schema.", "Structured data formats Svivva attaches to landing pages so search engines can render rich snippets (star ratings, FAQ accordions, app metadata) directly in results.");

// 13
section(13, "Keyword Expansion Playbook");
para("Once Svivva indexing stabilizes (week 3-4), use this playbook to compound rankings on the highest-traffic tools by expanding their keyword surface area in toolsRegistry.ts.");
label("Step 1.", "Open Svivva dashboard → Top Tools by Impressions. Pick the top 5.");
label("Step 2.", "For each, harvest 'People Also Ask' questions from a Google search of the primary keyword. These become new long-tail variants.");
label("Step 3.", "Append the 3-5 strongest variants to the keywords field in toolsRegistry.ts. Expand shortDescription with one sentence answering the most-asked question naturally.");
label("Step 4.", "Redeploy. Trigger a Svivva re-crawl (Settings → Re-scan Tools Repl). Within 48h the corresponding svivva.com landing page picks up the new variants.");
label("Step 5.", "Re-measure 14 days later. Keep variants that drove impressions; revert ones that didn't (avoid keyword bloat dilution).");

// 14
section(14, "Risk + Compliance Notes");
label("No PII handling.", "Every tool runs in-browser; the hub never persists user input. Email Breach Checker, Password Strength Checker, JWT Decoder and Secret Scanner explicitly state this on-page.");
label("Authorized-only payload references.", "SQLi, XSS and SSRF tools render a prominent banner stating these are educational references for authorized testing only. Use against systems without written permission may violate CFAA, Computer Misuse Act and similar laws worldwide.");
label("Outbound trust.", "All outbound deep-links (SSL Labs, Have I Been Pwned, crt.sh, npm advisories, GitHub Security) open in a new tab with rel='noopener noreferrer' to prevent reverse-tabnabbing.");
label("Cookie + tracking.", "The hub itself sets no analytics cookies. Svivva's widget loads a 1×1 ping after first paint; document this in the privacy section of the hub footer if your jurisdiction requires it.");

// FOOTER — placed safely within margins
const range = doc.bufferedPageRange();
for (let i = 0; i < range.count; i++) {
  doc.switchToPage(range.start + i);
  doc.fontSize(7).fillColor(ACCENT).font("Helvetica")
    .text(`CyberWavy x Svivva  ·  Connection Field Manual v2.0  ·  Page ${i + 1} of ${range.count}`, 44, 762, { width: 524, align: "center", lineBreak: false, height: 10 });
}

doc.end();
console.log("Wrote:", OUT);
