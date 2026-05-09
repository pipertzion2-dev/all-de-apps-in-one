/* eslint-disable */
const fs = require("fs");
const path = require("path");

const OUT = path.resolve(__dirname, "../exports/svivva-tools-pitch.html");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const src = fs.readFileSync(
  path.resolve(__dirname, "../artifacts/ai-tools-hub/src/data/tools.ts"),
  "utf8",
);

const objRe =
  /\{\s*id:\s*\d+,[\s\S]*?isBuiltIn:\s*(?:true|false),?(?:\s*iframeSrc:\s*'[^']+',?)?\s*\}/g;
const objs = [...src.matchAll(objRe)].map((m) => m[0]);

function pick(s, key) {
  const m = s.match(new RegExp(`${key}:\\s*'((?:[^'\\\\]|\\\\.)*)'`));
  return m ? m[1].replace(/\\'/g, "'") : "";
}
function pickArr(s, key) {
  const m = s.match(new RegExp(`${key}:\\s*\\[([\\s\\S]*?)\\]`));
  if (!m) return [];
  return [...m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => x[1].replace(/\\'/g, "'"));
}

const tools = objs.map((s) => ({
  slug: pick(s, "slug"),
  name: pick(s, "name"),
  category: pick(s, "category"),
  tagline: pick(s, "tagline"),
  description: pick(s, "description"),
  features: pickArr(s, "features"),
}));

const byCategory = {};
tools.forEach((t) => {
  (byCategory[t.category] = byCategory[t.category] || []).push(t);
});

const CATEGORY_COLORS = {
  "AI Prompt Tools": "#8b5cf6",
  "Developer Tools": "#ea580c",
  "AI Model Tools": "#0891b2",
  "Hardware & BOM": "#d97706",
  "Content & Writing": "#a855f7",
  "Code Tools": "#16a34a",
  "Language Tools": "#2563eb",
  "Data Tools": "#db2777",
  "Music & Audio": "#e11d48",
  "Research & Analysis": "#0d9488",
};

const CATEGORY_BLURB = {
  "Research & Analysis":
    "Twenty fast structured-thinking tools for researchers, founders, and analysts. From cognitive bias detection to causal chain mapping — every one is an SEO long-tail for someone who already needs structured help.",
  "Developer Tools":
    "Fourteen utilities developers Google for: linters, schema generators, regex helpers, doc tools. Pure utility, zero signup, every tool a keyword surface.",
  "AI Prompt Tools":
    "Thirteen prompt engineering aids — coverage analyzers, drift detectors, test case generators. Tools the prompt-eng audience wishes existed.",
  "Hardware & BOM":
    "Ten hardware engineering tools: BOM builders, component selectors, datasheet helpers. An unusually under-served SEO niche with high commercial intent.",
  "Music & Audio":
    "Ten music & audio tools — chord generators, scale browsers, generative composers. Creative-coding audience that overlaps with builders Svivva targets.",
  "AI Model Tools":
    "Six tools for working with AI models — comparison, evaluation, regression testing. Catches the technical side of the AI buyer journey.",
  "Content & Writing":
    "Seven content tools: AI chat, summarization, grammar, sentiment, tone — the broad demand layer that introduces casual users to the brand.",
  "Data Tools":
    "Two data tools: keyword extraction and Hypothesis Labs (the parent app for the 20 research tools above).",
  "Code Tools":
    "One core code tool: code explanation. A high-volume search term that converts curious learners into Svivva-aware visitors.",
  "Language Tools":
    "One translator tool. Universal demand; introduces Svivva to international audiences.",
};

const orderedCats = [
  "Research & Analysis",
  "Developer Tools",
  "AI Prompt Tools",
  "Hardware & BOM",
  "Music & Audio",
  "AI Model Tools",
  "Content & Writing",
  "Data Tools",
  "Code Tools",
  "Language Tools",
];

const esc = (s) =>
  String(s || "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const categoryHtml = orderedCats
  .filter((c) => byCategory[c])
  .map((cat) => {
    const list = byCategory[cat];
    const color = CATEGORY_COLORS[cat] || "#7c3aed";
    const cards = list
      .map(
        (t) => `
      <article class="card" style="--c:${color}">
        <header><h3>${esc(t.name)}</h3><span class="slug">/${esc(t.slug)}</span></header>
        <p class="tag">${esc(t.tagline)}</p>
        ${
          t.features && t.features.length
            ? `<ul class="feat">${t.features
                .slice(0, 3)
                .map((f) => `<li>${esc(f)}</li>`)
                .join("")}</ul>`
            : ""
        }
      </article>`,
      )
      .join("");
    return `
    <section class="cat">
      <div class="cat-head" style="--c:${color}">
        <h2>${esc(cat)}</h2>
        <span class="count">${list.length} tools</span>
      </div>
      <p class="cat-blurb">${esc(CATEGORY_BLURB[cat] || "")}</p>
      <div class="grid">${cards}</div>
    </section>`;
  })
  .join("");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>svivva-tools — YC-style brief</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
    color: #0f0815;
    background: #faf9fc;
    line-height: 1.5;
    font-size: 15px;
  }
  .wrap { max-width: 940px; margin: 0 auto; padding: 0 20px 80px; }
  .hero {
    background: linear-gradient(135deg, #0f0815 0%, #2e1065 100%);
    color: #fff;
    padding: 48px 24px 56px;
    margin-bottom: 32px;
  }
  .hero-inner { max-width: 940px; margin: 0 auto; padding: 0 20px; }
  .eyebrow { color: #a78bfa; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; }
  h1.title { font-size: clamp(34px, 7vw, 54px); font-weight: 800; margin: 8px 0 16px; letter-spacing: -0.02em; }
  .lead { color: #ddd6fe; font-size: clamp(15px, 2.3vw, 19px); max-width: 720px; line-height: 1.4; }
  .meta { color: #a78bfa; font-size: 12px; margin-top: 14px; }

  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: -28px auto 32px; max-width: 940px; padding: 0 20px; position: relative; z-index: 2; }
  @media (max-width: 600px) { .stats { grid-template-columns: repeat(2, 1fr); } }
  .stat {
    background: #fff; border: 1px solid #ede9fe; border-radius: 12px;
    padding: 14px 14px 12px; box-shadow: 0 4px 12px rgba(15,8,21,.05);
  }
  .stat .v { font-size: 28px; font-weight: 800; color: #7c3aed; line-height: 1; }
  .stat .l { font-size: 12px; font-weight: 700; margin-top: 6px; }
  .stat .s { font-size: 11px; color: #6b7280; margin-top: 2px; }

  section.block { margin: 28px 0; }
  h2.section {
    font-size: 22px; font-weight: 800; margin-bottom: 10px;
    padding-bottom: 6px; border-bottom: 2px solid #ede9fe;
  }
  h2.section::before {
    content: ""; display: inline-block; width: 6px; height: 18px; background: #7c3aed;
    margin-right: 10px; vertical-align: -3px; border-radius: 2px;
  }
  h3.sub { font-size: 14px; font-weight: 700; color: #5b21b6; margin: 12px 0 4px; }
  p { margin: 6px 0; }
  ul.bul { margin: 6px 0 6px 18px; }
  ul.bul li { margin: 3px 0; }

  .stages { display: grid; gap: 8px; margin-top: 8px; }
  .stage {
    display: grid; grid-template-columns: 36px 1fr; gap: 12px; align-items: start;
    background: #fff; border: 1px solid #ede9fe; border-radius: 10px; padding: 10px 14px;
  }
  .stage .n { background: #7c3aed; color: #fff; width: 28px; height: 28px; border-radius: 50%;
    display: grid; place-items: center; font-weight: 800; font-size: 13px; }
  .stage h4 { font-size: 14px; font-weight: 700; }
  .stage p { font-size: 13px; color: #374151; margin-top: 2px; }

  .comp { display: grid; gap: 8px; margin-top: 8px; }
  .row { background: #fff; border: 1px solid #ede9fe; border-radius: 10px; padding: 10px 14px; }
  .row h4 { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
  .row .them { color: #b45309; font-size: 13px; }
  .row .us { color: #047857; font-size: 13px; margin-top: 2px; }
  .row b { font-weight: 700; }

  .arch { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
  @media (max-width: 600px) { .arch { grid-template-columns: 1fr; } }
  .arch .a { background: #fff; border: 1px solid #ede9fe; border-radius: 10px; padding: 12px; }
  .arch .a h4 { font-size: 13px; font-weight: 700; color: #7c3aed; font-family: ui-monospace, monospace; }
  .arch .a p { font-size: 13px; color: #374151; margin-top: 4px; }

  section.cat { margin-top: 22px; }
  .cat-head { display: flex; align-items: baseline; gap: 12px; border-bottom: 2px solid var(--c); padding-bottom: 4px; margin-bottom: 6px; }
  .cat-head h2 { font-size: 18px; font-weight: 800; color: var(--c); }
  .cat-head .count { font-size: 12px; color: #6b7280; font-weight: 600; }
  .cat-blurb { font-size: 13px; color: #4b5563; margin-bottom: 10px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  @media (max-width: 800px) { .grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 500px) { .grid { grid-template-columns: 1fr; } }
  .card {
    background: #fff; border: 1px solid #ede9fe; border-left: 3px solid var(--c);
    border-radius: 8px; padding: 10px 12px; min-height: 100%;
  }
  .card header { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 4px; }
  .card h3 { font-size: 14px; font-weight: 700; line-height: 1.2; }
  .card .slug { font-size: 10px; color: #9ca3af; font-family: ui-monospace, monospace; white-space: nowrap; }
  .card .tag { font-size: 12px; color: #374151; line-height: 1.35; }
  .card .feat { list-style: none; margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px; }
  .card .feat li {
    font-size: 10px; background: #f5f3ff; color: #5b21b6;
    padding: 2px 6px; border-radius: 4px; line-height: 1.3;
  }

  .cta {
    background: linear-gradient(135deg, #7c3aed, #5b21b6); color: #fff;
    padding: 22px; border-radius: 14px; margin-top: 28px; text-align: center;
  }
  .cta h2 { font-size: 22px; font-weight: 800; margin-bottom: 6px; }
  .cta p { color: #ddd6fe; font-size: 14px; }
  .cta a { display: inline-block; margin-top: 12px; background: #fff; color: #5b21b6;
    padding: 10px 22px; border-radius: 999px; text-decoration: none; font-weight: 700; font-size: 14px; }

  footer { text-align: center; color: #9ca3af; font-size: 11px; margin-top: 32px; }

  @media print {
    body { background: #fff; font-size: 12px; }
    .hero { padding: 24px; }
    .stats { margin-top: -16px; }
    .grid { grid-template-columns: repeat(3, 1fr) !important; }
    section.cat { page-break-inside: avoid; }
    .card { break-inside: avoid; }
  }
</style>
</head>
<body>

<header class="hero">
  <div class="hero-inner">
    <div class="eyebrow">SVIVVA · ENGINEERING-AS-MARKETING</div>
    <h1 class="title">svivva-tools</h1>
    <p class="lead">A hub of ${tools.length} free AI mini apps that turns long-tail Google searches into Svivva customers.</p>
    <div class="meta">Built on Replit · pnpm monorepo · 3 artifacts · shipped to svivva.com</div>
  </div>
</header>

<div class="stats">
  <div class="stat"><div class="v">${tools.length}</div><div class="l">mini apps</div><div class="s">live & shipping</div></div>
  <div class="stat"><div class="v">98</div><div class="l">SEO pages</div><div class="s">sitemap-indexed</div></div>
  <div class="stat"><div class="v">${Object.keys(byCategory).length}</div><div class="l">categories</div><div class="s">distinct verticals</div></div>
  <div class="stat"><div class="v">$0</div><div class="l">CAC ceiling</div><div class="s">organic by design</div></div>
</div>

<main class="wrap">

  <section class="block">
    <h2 class="section">The one-liner</h2>
    <p>Most "free AI tools" sites are paywalled, fake, or thin. We shipped ${tools.length} fully-working mini apps — each with its own keyword-targeted SEO landing page — so people Googling narrow intent ("free decision tree maker", "json schema generator", "cognitive bias detector") land on a real working tool, get value in under 10 seconds, then funnel into the full Svivva platform.</p>
  </section>

  <section class="block">
    <h2 class="section">The problem</h2>
    <p>Acquiring developers, researchers, and operators is expensive and slow. Three failure modes dominate:</p>
    <h3 class="sub">1. The paywalled "free tool" trap</h3>
    <p>Most AI utility sites lock the actual output behind a signup. Visitors smell the gate within 3 seconds and leave with a bad impression of the brand.</p>
    <h3 class="sub">2. The thin SEO bait</h3>
    <p>Other sites publish a page per keyword that returns a half-broken result powered by a single LLM call. They rank briefly, but Google's helpful-content updates are crushing them.</p>
    <h3 class="sub">3. Paid ads in AI verticals</h3>
    <p>A Google Ads click in dev/AI keywords runs $4–$20. When the budget stops, traffic stops. No compounding, no asset, no defensibility.</p>
  </section>

  <section class="block">
    <h2 class="section">The solution</h2>
    <p>svivva-tools is engineering-as-marketing taken to its logical conclusion: ship the actual tool people are searching for, give it away free with no friction, and let the experience itself do the selling.</p>
    <ul class="bul">
      <li>${tools.length} working mini apps spanning ${Object.keys(byCategory).length} verticals — every tool is real, no fake demos, no signup walls.</li>
      <li>Each tool gets a structured landing page at svivva.com/&lt;slug&gt;: tagline, features, three-step how-to, FAQs, related tools.</li>
      <li>Tools embed in an iframe inline — visitor reads the page, clicks "Try Free →", and is using the tool within one second.</li>
      <li>A persistent "Svivva Seeds" frosted-glass ad surfaces the parent platform on every page — non-blocking, dismissible, always present.</li>
      <li>Every page is fully prerendered HTML for Google, with sitemap entries, semantic headings, and FAQ schema.</li>
    </ul>
  </section>

  <section class="block">
    <h2 class="section">Why now</h2>
    <h3 class="sub">Client-side AI primitives</h3>
    <p>Models, audio synthesis, schema validation, even small LLMs run entirely in the browser. Most of the ${tools.length} tools have zero server cost per use.</p>
    <h3 class="sub">Replit + pnpm monorepo workflow</h3>
    <p>Adding tool #${tools.length + 1} takes hours, not weeks. Single workspace, shared TypeScript config, three artifacts deploying independently.</p>
    <h3 class="sub">Google still rewards real utility</h3>
    <p>Helpful-content updates favor pages that solve the searcher's actual problem. A working tool inline with structured supporting content is exactly what those updates were designed to surface.</p>
  </section>

  <section class="block">
    <h2 class="section">How the funnel converts</h2>
    <div class="stages">
      <div class="stage"><div class="n">1</div><div><h4>Discover</h4><p>A searcher types "cognitive bias detector" or "json schema generator" into Google. They land on svivva.com/&lt;slug&gt; — fast static HTML, lighthouse-perfect.</p></div></div>
      <div class="stage"><div class="n">2</div><div><h4>Convert (use)</h4><p>They click "Try [tool] Free →". The actual working app launches in an iframe on the same page. No signup, no email gate, no rate limit. Value delivered in under 10 seconds.</p></div></div>
      <div class="stage"><div class="n">3</div><div><h4>Notice the brand</h4><p>The persistent Svivva Seeds banner sits at the bottom describing what the full platform does. Frosted-glass styling, dismissible, always present without blocking the tool.</p></div></div>
      <div class="stage"><div class="n">4</div><div><h4>Click through</h4><p>When ready (often after using 2–3 tools across the hub), they hit "Grow with Svivva →" or "Unlock All 50+ Tools" and arrive at svivva.com proper.</p></div></div>
      <div class="stage"><div class="n">5</div><div><h4>Compound</h4><p>Every shipped tool adds a new long-tail keyword surface. They share the same domain authority and funnel into the same product. The 85th tool ranks faster than the 1st.</p></div></div>
    </div>
  </section>

  <section class="block">
    <h2 class="section">Competitive position</h2>
    <div class="comp">
      <div class="row"><h4>Free AI tool aggregators</h4>
        <div class="them"><b>Theirs:</b> Listicles linking to 3rd-party tools. No control, no moat, no funnel.</div>
        <div class="us"><b>Ours:</b> We own the tool, the page, and the funnel.</div></div>
      <div class="row"><h4>Single-purpose SaaS</h4>
        <div class="them"><b>Theirs:</b> Build one good tool, charge for it. Capped TAM, paywall friction.</div>
        <div class="us"><b>Ours:</b> ${tools.length} free entry points, one paid platform behind them.</div></div>
      <div class="row"><h4>Generic AI assistants</h4>
        <div class="them"><b>Theirs:</b> One chat box, infinite use cases. High cognitive load on the user.</div>
        <div class="us"><b>Ours:</b> Each tool is named, scoped, and Google-discoverable.</div></div>
      <div class="row"><h4>Content marketing blogs</h4>
        <div class="them"><b>Theirs:</b> Articles about how to do something. Slow ranking, easy to skim and bounce.</div>
        <div class="us"><b>Ours:</b> Tool pages let users do the thing on the page — sticky.</div></div>
    </div>
  </section>

  <section class="block">
    <h2 class="section">How the Repl is built</h2>
    <p>A pnpm monorepo running on Replit with three artifacts that share a single TypeScript root and a Postgres database.</p>
    <div class="arch">
      <div class="a"><h4>artifacts/ai-tools-hub</h4><p>React + Vite SPA. Hosts the ${tools.length} landing pages, routing (Wouter), embedded-tool iframes, the Svivva Seeds ad, and the homepage category browser. This is what visitors see.</p></div>
      <div class="a"><h4>artifacts/api-server</h4><p>Node + Express. Hosts AI proxy endpoints (chat, summarization, image gen), rate-limited public APIs the embedded tools call, and lead-capture endpoints.</p></div>
      <div class="a"><h4>artifacts/mockup-sandbox</h4><p>Isolated Vite preview server. Used during design exploration — every component variant gets its own URL so we can iframe several side-by-side and pick the winner.</p></div>
      <div class="a"><h4>PostgreSQL</h4><p>Single Replit-managed database shared across artifacts. Stores per-tool usage events, lead captures, A/B test assignments.</p></div>
    </div>

    <h3 class="sub">How a new tool gets shipped</h3>
    <ul class="bul">
      <li><b>Drop the bundle.</b> Place a self-contained HTML/JS bundle into <code>public/tools/&lt;slug&gt;/</code>. Vanilla JS, prebuilt React, Spline embed — anything that runs in an iframe.</li>
      <li><b>Register the tool.</b> Add one entry to <code>src/data/tools.ts</code> with name, tagline, description, category, features, three-step how-to, FAQs. ~25 lines of TypeScript.</li>
      <li><b>Wire the SEO.</b> Append the slug to <code>public/sitemap.xml</code>. The landing page is auto-generated from the tools.ts entry.</li>
      <li><b>Optional: deep-link.</b> For multi-tool bundles, add <code>iframeSrc</code> to override the default iframe URL.</li>
      <li><b>Done.</b> Restart the workflow. The page renders at <code>svivva.com/&lt;slug&gt;</code>, the iframe loads, Google indexes within days.</li>
    </ul>

    <h3 class="sub">A clever bit: deep-linking into bundled apps</h3>
    <p>Hypothesis Labs is one prebuilt React app containing 20 sub-tools. Each sub-tool has its own SEO landing page on the hub, but they all iframe the same bundle, deep-linking via routes like <code>/tools/hypothesis-labs/t/compare-anything</code>. A custom Vite middleware serves the bundled HTML for every sub-route, and a <code>Location.prototype.pathname</code> patch strips the prefix so the embedded React Router thinks it is at the root. Result: 20 SEO pages, one shared bundle, zero rebuilds.</p>
  </section>

  <section class="block">
    <h2 class="section">The ${tools.length} mini apps</h2>
    <p>Every tool below is live, free, and individually indexed at svivva.com/&lt;slug&gt;. Names are written for Google search intent — what a user actually types, not internal jargon.</p>
    ${categoryHtml}
  </section>

  <section class="block">
    <h2 class="section">Roadmap</h2>
    <ul class="bul">
      <li><b>Next 30 days:</b> ship 20 more research tools, add per-tool usage analytics dashboard, A/B test the Svivva Seeds ad copy.</li>
      <li><b>Next 90 days:</b> reach 150 tools, launch a "tool of the week" newsletter to build retention beyond search, ship the API for embedding tools on third-party sites.</li>
      <li><b>Next 180 days:</b> 200+ tools, programmatic SEO for tool combinations ("X vs Y" comparison pages auto-generated from any two tools), API revenue line item.</li>
    </ul>
  </section>

  <section class="block">
    <h2 class="section">The ask</h2>
    <p>Keep shipping. Every new mini app is another keyword surface, another funnel entry point, another proof point that Svivva ships real software fast. No paid acquisition required, no permission needed — just write the app, register the slug, and let Google do the work.</p>
  </section>

  <div class="cta">
    <h2>Try it →</h2>
    <p>Browse all ${tools.length} tools, then see what the full Svivva platform can do for your business.</p>
    <a href="https://svivva.com">svivva.com</a>
  </div>

  <footer>svivva-tools · YC-style brief · save this page as PDF from your browser if needed</footer>
</main>
</body>
</html>`;

fs.writeFileSync(OUT, html);
const PUB = path.resolve(__dirname, "../artifacts/ai-tools-hub/public/pitch.html");
fs.writeFileSync(PUB, html);
console.log("Wrote", OUT, "(" + (html.length / 1024).toFixed(1) + " KB)");
console.log("Also wrote", PUB);
