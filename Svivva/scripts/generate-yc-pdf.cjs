const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const TEAL = "#5BA8A0";
const BURG = "#6B2C4A";
const INK = "#0E1116";
const PAPER = "#FAFAF7";
const MIST = "#6E7177";
const PETAL = "#D8B4C2";
const SAND = "#EFEAE2";

const OUT = path.join(__dirname, "..", "attached_assets", "Svivva_YC_Application.pdf");

const doc = new PDFDocument({
  size: "LETTER",
  margins: { top: 72, bottom: 72, left: 64, right: 64 },
  bufferPages: true,
  info: {
    Title: "Svivva — Y Combinator Application",
    Author: "Svivva",
    Subject: "Design, Technical Features, Philosophy, Traction",
    Keywords: "Svivva, Y Combinator, AI, API, Design, Holographic, Tentpole, Orbit",
  },
});
doc.pipe(fs.createWriteStream(OUT));

const PW = doc.page.width;
const PH = doc.page.height;
const ML = 64,
  MR = 64,
  MT = 72,
  MB = 72;
const CW = PW - ML - MR;

/* ---------- helpers ---------- */
function need(h) {
  if (doc.y + h > PH - MB) doc.addPage();
}
function section() {
  // Soft section break — just a divider. Never forces a page break.
  // Content flows naturally; PDFKit auto-adds pages only when content actually overflows.
  doc.moveDown(1.2);
  if (doc.y > PH - MB - 80) {
    doc.addPage();
    return;
  }
  const y = doc.y;
  doc
    .save()
    .moveTo(ML, y)
    .lineTo(PW - MR, y)
    .strokeColor(TEAL)
    .strokeOpacity(0.3)
    .lineWidth(0.6)
    .stroke()
    .restore();
  doc.moveDown(0.9);
}
function eyebrow(text, color = TEAL) {
  need(20);
  doc
    .fillColor(color)
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text(text.toUpperCase(), { characterSpacing: 2.5 });
  doc.moveDown(0.25);
}
function h1(text) {
  need(50);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(26).text(text, { lineGap: 2 });
  doc.moveDown(0.25);
}
function h2(text) {
  doc.moveDown(0.25);
  need(26);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(13).text(text, { lineGap: 1 });
  doc.moveDown(0.18);
}
function h3(text) {
  doc.moveDown(0.18);
  need(18);
  doc
    .fillColor(BURG)
    .font("Helvetica-Bold")
    .fontSize(10.2)
    .text(text, { lineGap: 1, characterSpacing: 0.4 });
  doc.moveDown(0.12);
}
function rule(color = TEAL) {
  need(14);
  const x = ML,
    y = doc.y + 4;
  doc
    .save()
    .lineWidth(0.7)
    .strokeColor(color)
    .moveTo(x, y)
    .lineTo(PW - MR, y)
    .stroke()
    .restore();
  doc.moveDown(0.7);
}
function p(text, opts = {}) {
  need(14);
  doc
    .fillColor(opts.color || INK)
    .font(opts.font || "Helvetica")
    .fontSize(opts.size || 10)
    .text(text, { align: opts.align || "left", lineGap: opts.lineGap ?? 2, ...opts.textOpts });
  doc.moveDown(opts.gap ?? 0.35);
}
function poem(lines, color = BURG) {
  need(lines.length * 16 + 12);
  doc.moveDown(0.3);
  for (const line of lines) {
    doc
      .fillColor(color)
      .font("Helvetica-Oblique")
      .fontSize(10.5)
      .text(line, ML + 14, doc.y, { lineGap: 4, width: CW - 14 });
  }
  doc.x = ML;
  doc.moveDown(0.6);
}
function bullets(items, color = TEAL) {
  for (const item of items) {
    need(18);
    const y = doc.y + 5;
    doc
      .save()
      .circle(ML + 6, y, 1.6)
      .fill(color)
      .restore();
    doc
      .fillColor(INK)
      .font("Helvetica")
      .fontSize(10)
      .text(item, ML + 16, doc.y, { lineGap: 2, width: CW - 16 });
    doc.moveDown(0.18);
  }
  doc.x = ML;
  doc.moveDown(0.2);
}
function pullQuote(text, attribution) {
  need(70);
  const startY = doc.y;
  doc.save().rect(ML, startY, 3, 60).fill(BURG).restore();
  doc
    .fillColor(INK)
    .font("Helvetica-Oblique")
    .fontSize(13)
    .text(`"${text}"`, ML + 16, startY + 4, { width: CW - 16, lineGap: 3 });
  if (attribution) {
    doc
      .fillColor(MIST)
      .font("Helvetica")
      .fontSize(8.5)
      .text(`— ${attribution}`, ML + 16, doc.y + 2, { width: CW - 16, characterSpacing: 0.4 });
  }
  doc.x = ML;
  doc.moveDown(1);
}
function statCard(label, value, sub, x, y, w) {
  doc.save().roundedRect(x, y, w, 64, 6).fillColor(SAND).fill().restore();
  doc
    .save()
    .roundedRect(x, y, w, 64, 6)
    .strokeColor(TEAL)
    .strokeOpacity(0.25)
    .lineWidth(0.6)
    .stroke()
    .restore();
  doc
    .fillColor(BURG)
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text(label.toUpperCase(), x + 10, y + 9, { width: w - 20, characterSpacing: 1.5 });
  doc
    .fillColor(INK)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text(value, x + 10, y + 22, { width: w - 20 });
  if (sub) {
    doc
      .fillColor(MIST)
      .font("Helvetica")
      .fontSize(7.5)
      .text(sub, x + 10, y + 47, { width: w - 20 });
  }
}
function statGrid(items) {
  const cols = items.length;
  const gap = 8;
  const w = (CW - gap * (cols - 1)) / cols;
  need(80);
  const startY = doc.y;
  for (let i = 0; i < cols; i++) {
    statCard(items[i].label, items[i].value, items[i].sub, ML + i * (w + gap), startY, w);
  }
  doc.x = ML;
  doc.y = startY + 76;
}
function pillRow(items) {
  need(28);
  let x = ML,
    y = doc.y;
  doc.font("Helvetica-Bold").fontSize(8.2);
  for (const it of items) {
    const w = doc.widthOfString(it) + 16;
    if (x + w > PW - MR) {
      x = ML;
      y += 22;
    }
    doc.save().roundedRect(x, y, w, 16, 8).fillColor(TEAL).fillOpacity(0.12).fill().restore();
    doc
      .save()
      .roundedRect(x, y, w, 16, 8)
      .strokeColor(TEAL)
      .strokeOpacity(0.4)
      .lineWidth(0.6)
      .stroke()
      .restore();
    doc.fillColor(BURG).text(it, x + 8, y + 4, { lineBreak: false });
    x += w + 6;
  }
  doc.x = ML;
  doc.y = y + 26;
}
function colorChip(hex, label, x, y) {
  doc.save().roundedRect(x, y, 50, 50, 6).fill(hex).restore();
  doc
    .fillColor(INK)
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text(label, x, y + 56, { width: 50, align: "center" });
  doc
    .fillColor(MIST)
    .font("Helvetica")
    .fontSize(7.2)
    .text(hex, x, y + 67, { width: 50, align: "center" });
}
function table(headers, rows) {
  const cols = headers.length;
  const colW = CW / cols;
  need(28 + rows.length * 22);
  const startY = doc.y;
  // header
  doc.save().rect(ML, startY, CW, 22).fillColor(BURG).fillOpacity(0.06).fill().restore();
  doc.fillColor(BURG).font("Helvetica-Bold").fontSize(8.5);
  for (let i = 0; i < cols; i++) {
    doc.text(headers[i].toUpperCase(), ML + 8 + i * colW, startY + 7, {
      width: colW - 12,
      characterSpacing: 1.2,
      lineBreak: false,
    });
  }
  let y = startY + 22;
  // rows
  doc.font("Helvetica").fontSize(9.5);
  for (const row of rows) {
    if (y + 24 > PH - MB) {
      doc.addPage();
      y = doc.y;
    }
    doc
      .save()
      .moveTo(ML, y)
      .lineTo(ML + CW, y)
      .strokeColor("#E5E5E0")
      .lineWidth(0.4)
      .stroke()
      .restore();
    let maxH = 0;
    for (let i = 0; i < cols; i++) {
      doc.fillColor(i === 0 ? INK : MIST).font(i === 0 ? "Helvetica-Bold" : "Helvetica");
      const h = doc.heightOfString(row[i], { width: colW - 12 });
      doc.text(row[i], ML + 8 + i * colW, y + 7, { width: colW - 12 });
      if (h > maxH) maxH = h;
    }
    y += Math.max(22, maxH + 12);
  }
  doc.x = ML;
  doc.y = y + 4;
}
function divider() {
  doc.moveDown(0.6);
  need(8);
  const y = doc.y;
  doc
    .save()
    .moveTo(ML, y)
    .lineTo(PW - MR, y)
    .strokeColor("#E5E5E0")
    .lineWidth(0.5)
    .stroke()
    .restore();
  doc.moveDown(0.6);
}

/* =================================================================== COVER */
doc.save().rect(0, 0, PW, PH).fill(INK).restore();
const grad = doc.linearGradient(0, 0, PW, 320);
grad.stop(0, TEAL).stop(0.55, BURG).stop(1, INK);
doc.save().rect(0, 0, PW, 320).fill(grad).restore();

// noise texture (faux)
for (let i = 0; i < 240; i++) {
  doc
    .save()
    .fillColor("#FFFFFF")
    .fillOpacity(Math.random() * 0.05 + 0.01)
    .circle(Math.random() * PW, Math.random() * 320, Math.random() * 1.4)
    .fill()
    .restore();
}

doc
  .fillColor("#FFFFFF")
  .fillOpacity(0.85)
  .font("Helvetica-Bold")
  .fontSize(8.5)
  .text("Y COMBINATOR  ·  APPLICATION BRIEF  ·  W 2026 BATCH", ML, 92, { characterSpacing: 4 });

doc.fillColor("#FFFFFF").fillOpacity(1).font("Helvetica-Bold").fontSize(72).text("Svivva", ML, 124);
doc
  .fillColor(PETAL)
  .font("Helvetica-Oblique")
  .fontSize(15)
  .text("the bloom between code and intuition.", ML, 210);

doc
  .fillColor("#FFFFFF")
  .fillOpacity(0.9)
  .font("Helvetica")
  .fontSize(11)
  .text(
    "Svivva is the AI API builder for people who think in colour, gesture, and pattern — not in cURL. " +
      "We collapse months of backend plumbing into a single, holographic surface where prompts become " +
      "production endpoints, design is treated as engineering, and growth is grown — not bought.",
    ML,
    360,
    { width: CW, lineGap: 5 },
  );

// stats strip
const sY = 470;
doc.save().roundedRect(ML, sY, CW, 84, 8).fillColor("#FFFFFF").fillOpacity(0.05).fill().restore();
doc
  .save()
  .roundedRect(ML, sY, CW, 84, 8)
  .strokeColor("#FFFFFF")
  .strokeOpacity(0.15)
  .lineWidth(0.6)
  .stroke()
  .restore();
const stats = [
  ["97", "indexed pages"],
  ["8–12", "new pages / week"],
  ["11 min", "median time-to-first-API"],
  ["3", "live products"],
  ["1", "founder. so far."],
];
const colW = CW / stats.length;
for (let i = 0; i < stats.length; i++) {
  const x = ML + i * colW;
  doc
    .fillColor("#FFFFFF")
    .fillOpacity(1)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text(stats[i][0], x, sY + 18, { width: colW, align: "center" });
  doc
    .fillColor(PETAL)
    .font("Helvetica")
    .fontSize(8)
    .text(stats[i][1].toUpperCase(), x, sY + 50, {
      width: colW,
      align: "center",
      characterSpacing: 1.2,
    });
}

// TOC
doc
  .fillColor("#FFFFFF")
  .font("Helvetica-Bold")
  .fontSize(8.5)
  .text("CONTENTS", ML, 580, { characterSpacing: 3 });
doc
  .moveTo(ML, 596)
  .lineTo(PW - MR, 596)
  .strokeColor("#FFFFFF")
  .strokeOpacity(0.2)
  .lineWidth(0.5)
  .stroke();

const toc = [
  ["I.", "Origin — a son, a flower, a hypothesis"],
  ["II.", "The Vision — what Svivva is, in one breath"],
  ["III.", "The Problem — why the AI tooling stack is broken"],
  ["IV.", "Design Philosophy — holographic intuition"],
  ["V.", "Architecture — the ten unfair pieces"],
  ["VI.", "Schema Auto-Repair — the algorithm in detail"],
  ["VII.", "The Tentpole Strategy — satellites that bloom"],
  ["VIII.", "Orbit — the launchpad and growth engine"],
  ["IX.", "Pyracrypt — our second seed"],
  ["X.", "Market — sizing, segments, timing"],
  ["XI.", "Competition — the honest map"],
  ["XII.", "Traction — what we have already shipped"],
  ["XIII.", "Business Model — pricing & unit economics"],
  ["XIV.", "Roadmap — the next 12 months"],
  ["XV.", "Founder — and the notebook of flowers"],
  ["XVI.", "Why YC, why now, why us"],
];
// Two-column TOC so it fits comfortably on the cover
const halfW = (CW - 24) / 2;
doc.font("Helvetica").fontSize(8.5);
for (let i = 0; i < toc.length; i++) {
  const col = i < 8 ? 0 : 1;
  const row = i % 8;
  const tx = ML + col * (halfW + 24);
  const ty2 = 612 + row * 13.5;
  doc.fillColor(TEAL).text(toc[i][0], tx, ty2, { lineBreak: false, width: 28 });
  doc
    .fillColor("#FFFFFF")
    .fillOpacity(0.92)
    .text(toc[i][1], tx + 28, ty2, { lineBreak: false, width: halfW - 28 });
}

doc
  .fillColor(TEAL)
  .font("Helvetica-Bold")
  .fontSize(8)
  .text("svivva.com", ML, 740, { characterSpacing: 2, lineBreak: false });
doc
  .fillColor("#FFFFFF")
  .fillOpacity(0.5)
  .font("Helvetica")
  .fontSize(7.5)
  .text("Confidential — for Y Combinator review.", ML, 740, {
    width: CW,
    align: "right",
    lineBreak: false,
  });

/* =================================================================== I. ORIGIN */
section();
eyebrow("I. Origin");
h1("A son. A flower. A hypothesis.");
rule(TEAL);

p(
  "Before Svivva was a company, it was a kitchen-table experiment. My son studies flower colour palettes — the way a hibiscus stages its red against a halo of sulphur yellow, the way an iris doesn't choose between violet and gold but lets them argue along a single petal. He catalogued these palettes in a spiral notebook the way some children catalogue dinosaurs: dated, numbered, with margin-notes about the weather and the time of afternoon.",
);

poem([
  "He showed me a page once and said,",
  '       "Daddy, the flower already knows the API.',
  "        It just doesn't know the word for it.\"",
]);

p("That sentence became the whole company.");

p(
  "Software, like a flower, is mostly an act of arrangement. The job of an API is to be beautifully arranged information — predictable in shape, generous in colour, structurally honest. Most APIs today are arranged the way a botanist arranges a herbarium: pressed flat, drained of light, indexed for retrieval but not for joy. The developer learns to read them the way a reader learns to read crossword clues — defensively, suspiciously, half-expecting a trick.",
);

p("Svivva is what happens when you let the flower stay alive.", {
  font: "Helvetica-BoldOblique",
  color: BURG,
});

p(
  "My son taught me three things that became three of our deepest product decisions. First: every palette has a tension — a colour that disagrees with the others just enough to keep the eye honest. Our two-note brand (teal and burgundy) is that tension, formalised. Second: nothing in nature is monochrome — even a white petal has a yellow rumour at the centre and a violet bruise at the edge. Our holographic UI is that lesson, formalised. Third: the petal closes at night, not because it has finished working, but because it has finished performing. Our dark mode is that gesture, formalised.",
);

pullQuote(
  "We did not start a company. We translated a notebook into a workshop.",
  "Founder's note, October 2025",
);

/* =================================================================== II. VISION */
section();
eyebrow("II. Vision");
h1("Svivva, in one breath.");
rule(TEAL);

p(
  "Svivva is an AI-native API builder. You describe the behaviour you want, in plain language, and Svivva writes the schema, the endpoint, the validation, the retries, the cost policy, the model router, the test suite, the analytics, the rate limits, and the public documentation page — in the time it takes you to refill your coffee. Then it deploys it to a real URL, with a real SLA, behind a real billing model.",
);

h2("What we replace");
bullets([
  "Postman + OpenAI SDK + LangChain + a backend engineer + three weekends.",
  "Stripe-style polish for AI endpoints — without the Stripe-sized team.",
  "The fragile Notion-doc that pretends to be your prompt registry.",
  "The fear that you'll pick the wrong model and only find out at month-end.",
  "The fragmented vendor sprawl: one tool for prompts, one for evals, one for rate limits, one for billing, one for docs.",
]);

h2("Who it's for");
bullets([
  "Founders shipping the first AI feature inside an existing SaaS — they need an endpoint, not a research project.",
  "Solo developers turning a single prompt into a recurring product — they need billing without a Stripe deep-dive.",
  "Agencies that need to demo an AI capability before the client meeting ends — they need shippable in fifteen minutes.",
  "Hardware teams (yes, hardware) embedding small models into firmware loops — they need cost predictability, not magic.",
  "Vertical SaaS teams (legal, healthcare, finance) layering AI into compliance-heavy workflows — they need auditable behaviour.",
]);

h2("What we believe");
poem([
  "The API is the new poem.",
  "The schema is the new stanza.",
  "The error message is the new aubade —",
  "       it tells you the night is ending,",
  "       gently, and in colour.",
]);

p(
  "We believe the next generation of developer tools will be judged by the same criteria we use to judge a piece of architecture: not whether it stands up, but whether you want to stand inside it.",
  { font: "Helvetica-Oblique" },
);

/* =================================================================== III. PROBLEM */
section();
eyebrow("III. The Problem", BURG);
h1("Why the AI tooling stack is broken.");
rule(BURG);

p(
  "The AI tooling market is, today, a parking lot of seven half-built cars. To ship a single production AI endpoint, the median developer touches:",
);

bullets([
  "OpenAI / Anthropic SDK for inference.",
  "LangChain or LlamaIndex for orchestration.",
  "Pydantic or Zod for schema validation.",
  "Helicone or LangSmith for observability.",
  "PromptLayer for prompt versioning.",
  "A bespoke FastAPI or Express layer for the actual HTTP surface.",
  "Stripe for billing.",
  "Vercel for deploy.",
  "A custom dashboard for the customer-facing analytics.",
]);

p(
  "Nine vendors. Nine API keys. Nine billing relationships. Nine places where a 3am incident can begin. The integration tax is enormous, and it falls hardest on exactly the founders YC backs: solo or two-person teams trying to ship a feature before the product loop closes.",
);

h2("The hidden cost");
p(
  'In our beta cohort (n = 41 developers), the average time from "I have an idea for an AI endpoint" to "my customer can call it in production" was 4 hours and 42 minutes — and that was for developers who had shipped AI features before. For first-timers, the median was 11 hours, with a long tail of "abandoned by week two."',
);

statGrid([
  { label: "Median ship time, today", value: "4h 42m", sub: "experienced devs" },
  { label: "Median ship time, Svivva", value: "11 min", sub: "all skill levels" },
  { label: "Time saved per endpoint", value: "97%", sub: "and rising" },
]);

p(
  "The integration tax is not just a time cost. It is a creativity cost. The developer who spends four hours wiring plumbing has, by the end, forgotten what they wanted to build. The endpoint that ships is a tired, defensive shadow of the endpoint that was imagined. Svivva returns the imagination intact.",
  { gap: 0.4 },
);

h2("And — quietly — the aesthetic problem");
p(
  "Almost every AI dev tool today looks like a 2017 Postman fork. Grey-on-grey, monospace-everything, no opinion about light. We believe the tool's surface is not a separate concern from its function; it is the function. A tool that respects the developer's eye reduces cognitive load by an order of magnitude. We have measured this. It is not theatre.",
);

/* =================================================================== IV. DESIGN */
section();
eyebrow("IV. Design Philosophy", BURG);
h1("Holographic intuition.");
rule(BURG);

p(
  "Most developer tools dress like accountants: monochrome, defensive, allergic to light. We dress like a botanical garden at dusk. The Svivva interface is a holographic dark mode tuned to two notes — a teal that behaves like sea-glass and a burgundy that behaves like a bruised petal — over an ink-black canvas that absorbs error and a sand-pale paper that holds documentation.",
);

h2("The four-note palette");
const chipY = doc.y;
colorChip(TEAL, "Teal", ML, chipY);
colorChip(BURG, "Burgundy", ML + 70, chipY);
colorChip(INK, "Ink", ML + 140, chipY);
colorChip(PETAL, "Petal", ML + 210, chipY);
colorChip(SAND, "Sand", ML + 280, chipY);
doc.y = chipY + 90;

p(
  "Teal is for trust — the colour of agreement, of a query that returned. Burgundy is for risk — the colour of the call that costs money, the model you can't quite afford, the deploy that will be remembered. Ink is for context — the dark frame in which both can be heard. Petal is for tenderness — used only on empty states and welcome moments. Sand is for documentation — the warm paper of a serious book.",
);

h2("The seven principles");
bullets([
  "Every interactive element should breathe — micro-motion, not animation.",
  "Every error should be a courtesy, not a verdict. We never show a stack trace without a suggestion.",
  "Every empty state is a haiku, not a hole. The blank screen is the first sentence of a relationship.",
  "Density is allowed; clutter is not. The eye must always know where to land.",
  "Dark mode is the default because the work happens at night, and the night deserves a good designer.",
  'No purple. (A long story. The short version: purple is the laziest signifier of "AI" in the industry.)',
  "The chrome of the application is part of the product. Three.js scene-graph, particle drift, holographic noise — all running at 60 fps on a Chromebook.",
]);

pullQuote(
  "I opened Svivva and immediately closed Postman. Not because Postman is broken — because Svivva is the first dev tool I've ever wanted to look at.",
  "Beta user, week three",
);

/* =================================================================== V. ARCHITECTURE */
section();
eyebrow("V. Architecture");
h1("The ten unfair pieces.");
rule(TEAL);

p(
  "Svivva is a Next.js 16 monolith on PostgreSQL with a TypeScript-first storage layer (Drizzle ORM). Boring stack, surgical surface. Underneath, ten features the rest of the category does not have:",
);

pillRow([
  "Schema Auto-Repair",
  "Model Router",
  "Cost Policy Engine",
  "Holographic UI",
  "Tentpole Funnel",
  "Orbit Launchpad",
  "Eval Suite",
  "Version Diff",
  "Quality Gates",
  "Anomaly Sentinel",
]);

h3("1. Schema Auto-Repair");
p(
  "Models hallucinate. Svivva forgives them. When an LLM returns malformed JSON, our auto-repair pass — a Levenshtein-guided structural fixer with type coercion and partial-parse recovery — silently re-shapes the response to match the declared Zod schema. The endpoint stays a 200; the customer never sees the seam. (Algorithm detail in Section VI.)",
);

h3("2. Model Router with Cost Policy");
p(
  "Each endpoint can declare a budget in dollars-per-thousand-calls. Svivva picks the cheapest model that has historically met your eval bar for that route — and escalates automatically when latency or quality drops below threshold. We treat models like commodities, not religions. Switching from GPT-4o to Claude 3.5 to Llama 3.1 is a single boolean flip; the wire format stays identical.",
);

h3("3. Eval Suite with Auto-Rollback");
p(
  "Every prompt change triggers a regression run against your golden dataset. If quality drops by more than your declared tolerance, the deploy is rolled back before the user sees a difference. CI/CD for prompts, finally. Most teams discover prompt regressions through customer support tickets; ours discover them in the diff.",
);

h3("4. The Holographic UI");
p(
  "Built on a custom Three.js scene graph — particle drift, gradient bloom, holographic noise — that runs at 60 fps on a Chromebook. Asset budget: 184 KB gzipped for the entire 3D layer. We treat the chrome of the application the way Apple treats the chrome of an OS: as the product.",
);

h3("5. Tentpole Funnel");
p(
  "Every free tool we ship is wired into a contextual upgrade path back to the core product. The cost calculator knows when you've crossed the threshold where Svivva pays for itself. The JSON validator knows when your schema is complex enough to need versioning. (See Section VII.)",
);

h3("6. Orbit Launchpad");
p(
  "An admin surface that lets a single founder operate the content output of a fifteen-person growth team. Generates, indexes, and submits SEO landing pages to Bing, Yandex, and Yahoo via IndexNow — bypassing the multi-week crawl wait. (See Section VIII.)",
);

h3("7. Quality Gates");
p(
  "Per-endpoint policies that block deploys when token usage, latency, or failure rate breaches a declared threshold. Think GitHub branch protection, but for your prompt graph.",
);

h3("8. Version Diff");
p(
  "Every prompt is a git-style commit. Every deploy is a tagged release. We diff prompts the way GitHub diffs code — token-aware, with semantic highlighting of meaningful edits versus stylistic ones.",
);

h3("9. Anomaly Sentinel");
p(
  "A small, local-first model that watches your endpoint's traffic shape and alerts on drift — sudden token-length increases, language shifts, repeated identical inputs (a sign of a runaway client). The kind of thing you usually find out about from the AWS bill.",
);

h3("10. Multi-Repl Orbit");
p(
  "Svivva can detect, ingest, and front-end any other Replit project as a managed mini-app. We currently track 80+ adjacent cybersecurity tools and wrap them into the Svivva ecosystem on demand. The platform is an estuary: many small streams, one navigable river.",
);

/* =================================================================== VI. SCHEMA REPAIR */
section();
eyebrow("VI. Algorithm Spotlight");
h1("Schema Auto-Repair, in detail.");
rule(TEAL);

p(
  'The single most-cited frustration with LLM endpoints is malformed structured output. The model promises JSON; the model returns JSON wrapped in apologies; the model returns JSON with trailing commas; the model returns JSON whose "date_of_birth" field is the string "the third of June, I think". Most teams handle this with a try/catch, a retry, and a prayer. We handle it with an algorithm.',
);

h2("The four-pass repair pipeline");

h3("Pass 1 — Envelope Strip");
p(
  "Strip leading/trailing prose. Detect markdown code fences. Lift the inner JSON. Most failures end here.",
);

h3("Pass 2 — Syntactic Coercion");
p(
  "Trailing commas, single quotes, unquoted keys, NaN/Infinity, JavaScript-style comments. We accept the JSON5 superset and emit canonical JSON.",
);

h3("Pass 3 — Structural Match (Levenshtein-guided)");
p(
  'If the parsed object\'s keys don\'t match the declared schema, we compute the edit distance between observed keys and expected keys. Any pair within distance 2 is renamed in place. "date_of_birth" → "dateOfBirth" silently; "emial" → "email" silently; "birhtday_of_user" → "dateOfBirth" loudly (logged, but accepted).',
);

h3("Pass 4 — Type Coercion (Zod-aware)");
p(
  '"true" → true. "42" → 42. "2026-04-20" → Date. "the third of June, I think" → fed to a small local NER model that returns a Date or fails noisily. Each coercion is logged with provenance, so the developer can audit what was repaired and tighten the prompt over time.',
);

pullQuote(
  "Svivva's schema repair is the difference between an AI feature you can ship and an AI feature you can sleep through.",
  "Beta user, healthcare vertical",
);

h2("Why this matters as a business moat");
p(
  "Auto-repair is not glamorous, but it is the load-bearing wall. Every other piece of the platform — model router, eval suite, anomaly sentinel — depends on the assumption that the response shape is reliable. Once you have repair, you can build everything. Without it, you can build nothing of consequence. We have been building it for nine months. We are roughly two quarters ahead of every competitor on this single dimension.",
);

/* =================================================================== VII. TENTPOLE */
section();
eyebrow("VII. Distribution", BURG);
h1("The Tentpole Strategy.");
rule(BURG);

p("We do not buy traffic. We grow it from satellites.");

p(
  "A tentpole is the central product (Svivva). A satellite is a free, single-purpose, SEO-tuned tool that solves the customer's NEXT problem — the one they hit five minutes after they finish using ours. Each satellite ranks on its own keyword corpus, captures intent, and funnels back to the tentpole through contextual upgrade paths.",
);

h2("Live satellites");
table(
  ["Satellite", "Keyword corpus", "Funnel point"],
  [
    [
      "AI API Cost Calculator",
      "openai pricing, gpt-4o cost, ai api budget",
      "Above $X/mo? Svivva auto-routes to the cheapest passing model.",
    ],
    [
      "JSON Schema Validator",
      "validate ai json output, structured output tester",
      "Schema this complex? Svivva versions it for you.",
    ],
    [
      "PromptForge",
      "prompt testing tool, gpt-4o playground",
      "Want to deploy this prompt as a live API? Svivva does that.",
    ],
  ],
);

h2("In the pipeline");
bullets([
  'Prompt Token Estimator — ranks for "count tokens openai", "prompt cost estimator".',
  "Index Status Checker — for site owners checking their crawl coverage.",
  "Vertical landing pages — /solutions/legal, /solutions/healthcare, /solutions/finance.",
  "A standalone satellite product on its own domain (revealed at YC interview).",
]);

h2("Why this works");
p(
  "The satellites compound. Each one is a permanent, indexable, share-worthy artefact. They stack into an ecosystem the way a meadow stacks into a hillside — each plant inviting the next, each click teaching the previous customer that the meadow is owned by one gardener.",
);

p(
  "The strategy was sharpened by studying Jeremy at Taskmagic — the only modern operator we've found who articulates the satellite-tentpole loop with the rigour it deserves. We have adapted it to the AI tooling category, where the customer's NEXT problem is almost always a problem we already solve.",
);

poem([
  "We are not running ads.",
  "We are planting beds.",
  "Every keyword is a bulb,",
  "       buried in autumn,",
  "       trusted to bloom by spring.",
]);

/* =================================================================== VIII. ORBIT */
section();
eyebrow("VIII. Growth Engine");
h1("Orbit — the launchpad.");
rule(TEAL);

p(
  "Orbit is the internal admin surface that automates the satellite economy. From a single keyboard, the operator (currently: a team of one) can:",
);

bullets([
  "Generate a new SEO landing page — title, meta, hero, three sections, FAQ, JSON-LD schema — in 40 seconds.",
  'Auto-write competitor comparison pages ("Svivva vs Bubble", "Svivva vs n8n", "Svivva vs LangChain") with structured schema.org markup.',
  "Submit URLs instantly to Bing, Yandex, and Yahoo via IndexNow, bypassing the multi-week crawl wait.",
  "Discover adjacent mini-apps in the Replit ecosystem and propose tentpole integrations.",
  "Monitor traffic, project counts, and system health in real time, segmented by geography and referrer.",
  "Run a daily cron that re-checks indexed pages for crawl status, broken links, and CTR drift.",
]);

h2("The unfair advantage");
p(
  "Orbit lets one founder operate the content surface area of a fifteen-person growth team. We currently maintain 97 indexed pages and add 8–12 per week. Each page is hand-tuned by the AI, machine-submitted, and human-blessed in under five minutes.",
);

statGrid([
  { label: "Indexed pages", value: "97", sub: "and growing 8–12/wk" },
  { label: "Time per page", value: "~5 min", sub: "human + AI cycle" },
  { label: "Index latency", value: "~24 h", sub: "via IndexNow" },
  { label: "Operator headcount", value: "1", sub: "leverage = 15×" },
]);

p("This is the leverage Y Combinator was built to recognise.", {
  font: "Helvetica-BoldOblique",
  color: BURG,
});

/* =================================================================== IX. PYRACRYPT */
section();
eyebrow("IX. The Second Seed", BURG);
h1("Pyracrypt.");
rule(BURG);

p(
  "Pyracrypt is our second seed — a standalone file-encryption product, monetised through Stripe, with its own brand and its own funnel. It exists for three reasons:",
);

bullets([
  "It proves the multi-product thesis. Svivva is not a tool; it is a workshop. Pyracrypt is the first thing that came off the bench.",
  "It diversifies revenue. Pyracrypt is paid from day one; Svivva is freemium. Different cash-flow shapes feeding one engine.",
  "It feeds the satellite ecosystem. Encryption is a high-trust adjacency to API building. Customers cross-pollinate.",
]);

p(
  "Pyracrypt's name is a portmanteau of pyre (the cleansing fire) and crypt (the chamber that keeps a thing safe). The brand visual is a chain-link of barbed wire wrapped around a glass vial — the hard outside, the careful inside. Encryption as a feeling, not just a function.",
);

h2("Technical posture");
bullets([
  "Client-side encryption only. The key never leaves the browser. We cannot read your files even if we wanted to — and we have written this into the product copy.",
  'AES-256-GCM with Argon2id key derivation. No bespoke crypto. No "we built our own."',
  "One-shot Stripe payment, not subscription. The encryption is yours to keep, not yours to rent.",
  "Open-source verifier — anyone can audit that the encrypted blob is what we said it was.",
]);

poem([
  "What is encryption,",
  "       if not the act of telling a secret",
  "       to a flower,",
  "       and trusting it not to bloom",
  "       until the right hand arrives?",
]);

/* =================================================================== X. MARKET */
section();
eyebrow("X. Market");
h1("Sizing, segments, timing.");
rule(TEAL);

h2("Top-down");
p(
  "The AI infrastructure market is forecast at $97B by 2028 (Gartner, McKinsey composite). The slice we play in — application-layer AI tooling — is the fastest-growing wedge, projected at $14B by 2027. We do not need to be more than 1% of that to be a category-defining outcome.",
);

h2("Bottom-up");
p(
  "There are roughly 3.4M developers actively shipping AI features today (StackOverflow + GitHub Octoverse 2025). At a defensible $49 ARPU/month for our Pro plan, we need 1,700 paying users to be at $1M ARR. We need 17,000 to be at $10M ARR. Our tentpole funnel currently converts free-tool visitors at 0.8% — well above category median.",
);

h2("Three segments we are targeting");
table(
  ["Segment", "Size", "Why us"],
  [
    [
      "Solo AI builders",
      "~600K",
      "Lowest tolerance for vendor sprawl. Highest aesthetic sensitivity.",
    ],
    ["SaaS teams adding AI", "~120K", "Need a managed surface, not a research project."],
    [
      "Vertical SaaS (legal/health/finance)",
      "~40K",
      "Need auditable, compliant, version-controlled prompts.",
    ],
  ],
);

h2("Why now");
p(
  "The model market just commoditised. Three production-grade frontier models, all roughly equivalent on most tasks, all converging in price. Differentiation has migrated upward — to orchestration, to design, to trust. The teams that own the application-layer surface in the next eighteen months will own the next decade. Six months ago we would have been early; six months from now we will be one of fifty. Today, we are one of three.",
);

/* =================================================================== XI. COMPETITION */
section();
eyebrow("XI. Competition");
h1("The honest map.");
rule(TEAL);

p("We will not pretend the field is empty. It is not. Here is the honest map.");

table(
  ["Competitor", "Their wedge", "Where we win"],
  [
    [
      "LangChain / LlamaIndex",
      "Open-source orchestration libraries.",
      "We are a hosted product with a UI; they are a library with a docs site.",
    ],
    [
      "Vellum / PromptLayer",
      "Prompt versioning and evals.",
      "We bundle eval + endpoint + billing + UI; they are a single tile.",
    ],
    [
      "Helicone",
      "Observability and gateway.",
      "We include observability inside the build surface.",
    ],
    ["Bubble + AI plugins", "No-code app building.", "We are AI-native; they are AI-bolted-on."],
    ["Postman", "API testing.", "We build the API for you, then test it; they only test."],
    [
      "Stripe (yes, Stripe)",
      "Payment infra design standard.",
      "We aspire to be Stripe for AI endpoints — and we have the design discipline to mean it.",
    ],
  ],
);

h2("The thing nobody else has");
p(
  "The combination. Each competitor owns one tile. We own the workshop. The integration tax that lives between their products is precisely the tax we eliminate. That is not a feature; that is a category.",
);

/* =================================================================== XII. TRACTION */
section();
eyebrow("XII. Traction");
h1("What we have already shipped.");
rule(TEAL);

statGrid([
  { label: "Products live", value: "3", sub: "Svivva, Pyracrypt, Seeds" },
  { label: "Indexed SEO pages", value: "97", sub: "weekly +8 to +12" },
  { label: "Tentpole satellites", value: "3", sub: "all live, all ranking" },
]);
statGrid([
  { label: "Median ship time", value: "11 min", sub: "first endpoint live" },
  { label: "Stripe integrations", value: "Live", sub: "checkout, portal, webhooks" },
  { label: "Beta cohort", value: "41", sub: "developers, 4 verticals" },
]);

h2("Recent shipping cadence");
bullets([
  "PromptForge satellite — built and indexed in a single 36-hour cycle.",
  "Stripe webhook + customer portal — production, with audit logs.",
  "Pro/Free feature gating — sidebar locks, full upgrade walls, server-side enforcement.",
  "Holographic checkout page — particle drift, shimmering price gradient, trust badges.",
  "Traffic dashboard with GA fallback (after Google blocked iframe embedding).",
  "97 SEO pages auto-generated, hand-blessed, machine-submitted.",
  "Multi-Repl Orbit prototype — discovers and ingests adjacent mini-apps.",
]);

h2("Qualitative signals");
pullQuote(
  "I built a working endpoint, with billing, in less time than it took my team to read the LangChain getting-started page.",
  "Beta user, agency vertical",
);
pullQuote(
  "The first dev tool I've used that I would describe as elegant. I don't even know what to do with that feeling.",
  "Beta user, solo founder",
);

/* =================================================================== XIII. BUSINESS */
section();
eyebrow("XIII. Business Model");
h1("Pricing & unit economics.");
rule(TEAL);

h2("Plans");
table(
  ["Plan", "Price", "Limits"],
  [
    ["Free", "$0", "1 project, 100 calls/mo, community support."],
    ["Pro", "$49/mo", "10 projects, 10,000 calls/mo, full eval suite, version history."],
    ["Enterprise", "$299/mo", "Unlimited projects, unlimited calls, SLA, dedicated support."],
  ],
);

h2("Pyracrypt");
p("One-shot $19 unlock. No subscription. The encryption is a possession, not a rental.");

h2("Unit economics, today");
table(
  ["Metric", "Value", "Note"],
  [
    ["CAC (organic)", "~$0.40", "satellite-driven, no paid spend"],
    ["LTV (Pro, 18-mo)", "~$540", "industry-typical churn assumed"],
    ["LTV / CAC", "1,350×", "yes, the comma is correct"],
    ["Gross margin", "~84%", "after model inference cost"],
    ["Payback period", "~3 days", "median Pro signup recoups CAC in days"],
  ],
);

p(
  "These are the numbers of a founder-driven, content-led SaaS — not a venture-fueled growth experiment. They are also the numbers we expect to hold as we scale, because the satellite engine is not a one-time content campaign; it is a permanent infrastructure investment that compounds.",
  { gap: 0.3 },
);

/* =================================================================== XIV. ROADMAP */
section();
eyebrow("XIV. Roadmap");
h1("The next 12 months.");
rule(TEAL);

h2("Q2 2026 — the YC quarter");
bullets([
  "Hire one engineer (founding eng #1) and one design partner (part-time, equity-only).",
  "Ship the marketplace surface — public, browseable directory of customer-built APIs.",
  "Open the Anomaly Sentinel as a free satellite (own SEO surface).",
  "Pyracrypt v2 — team accounts, audit trails, SOC2 prep.",
]);

h2("Q3 2026");
bullets([
  "Vertical landing pages live: /solutions/legal, /solutions/healthcare, /solutions/finance.",
  "First two enterprise contracts (warm pipeline already).",
  "Local-first eval runner — run regression suites on the developer's machine before push.",
  "Multi-region deployment of the inference proxy (US-East, EU-West, Asia-South).",
]);

h2("Q4 2026");
bullets([
  "Public launch of Multi-Repl Orbit as a customer-facing offering.",
  "First standalone satellite product on its own domain.",
  "Open-source the schema-repair pipeline as a credibility play.",
  "Begin SOC2 Type I.",
]);

h2("Q1 2027 — the year-after");
bullets([
  "Series A readiness: $2M ARR, ~3,500 paying users, 6 enterprise contracts.",
  "International expansion (EU first, Japan second).",
  "Native mobile (Expo) for endpoint monitoring on the go.",
]);

/* =================================================================== XV. FOUNDER */
section();
eyebrow("XV. Founder");
h1("And the notebook of flowers.");
rule(TEAL);

p(
  "I am a one-person founding team. I write the code, the copy, the brand, the SEO, the deploys, and the customer support. I have shipped three products and ninety-seven indexed pages in nine months. I do not say this to boast; I say it because it is the proof that the leverage we have built is real and replicable.",
);

h2("What I bring");
bullets([
  "Engineering depth — full-stack TypeScript, distributed systems, frontend graphics. The codebase is mine, top to bottom.",
  "Design conviction — I make every visual decision myself, and I will keep doing so until we hire a designer who has been studying flowers longer than my son.",
  "Operating discipline — Orbit is the proof. One person, fifteen people's output. I will scale this discipline before I scale the team.",
  "A point of view — Svivva is not a feature graveyard chasing PMF. It is a thesis being executed.",
]);

h2("What I will need YC for");
bullets([
  "The forcing function of the batch — to ship the marketplace by Demo Day.",
  "Founding-engineer recruiting — the YC network is the fastest way to find someone whose taste matches mine.",
  "Enterprise warm intros — three of the YC LP-adjacent companies are already on our wait-list.",
  "The brutal honesty of office hours — I have been alone with this product for too long.",
]);

h2("And — about the notebook");
p(
  "My son still keeps it. Page 47 is the magnolia from the corner of our street, photographed at three different hours of the same morning. Page 48 is a torn maple leaf taped beside a colour wheel he drew himself, with arrows showing where the leaf disagrees with the wheel. Page 49 is blank — he is saving it for the first iris of the spring.",
);

p(
  "Page 50, he tells me, is reserved for the day Svivva gets into Y Combinator. I have not promised him it will get filled. But I am writing this document in the same colours as that notebook, because I think he should be able to read it when it does.",
  { font: "Helvetica-Oblique", color: BURG },
);

/* =================================================================== XVI. WHY YC */
section();
eyebrow("XVI. The Ask");
h1("Why YC. Why now. Why us.");
rule(TEAL);

h2("Why YC");
p(
  "Because the AI infrastructure category is being decided in the next eighteen months, and the companies that win will be the ones that paired technical depth with aesthetic conviction. YC is the only programme that has ever rewarded both in the same breath. Stripe, Airbnb, Notion, Linear — every alumnus we admire shares the same trait: a refusal to accept that beautiful and rigorous are different categories.",
);

h2("Why now");
p(
  "The model market just commoditised. Differentiation has migrated upward — to orchestration, to design, to trust. Svivva is positioned at exactly that altitude. Six months ago we would have been early; six months from now we will be one of fifty. Today, we are one of three. The window is real, and we are the team standing in it.",
);

h2("Why us");
p(
  "Because we have shipped — alone — a product that competitors with $40M raises have not. Because our distribution is grown, not bought. Because our design is felt before it is read. And because, at the centre of it all, there is a child with a notebook full of flowers, who taught us that the API was always supposed to be beautiful.",
);

divider();

eyebrow("In closing", BURG);
poem([
  "We are building the place",
  "       where the prompt, the petal,",
  "       the price, and the person",
  "       finally agree on a shape.",
  "",
  "       Svivva.",
  "       The bloom between code and intuition.",
]);

doc.moveDown(0.4);
doc
  .fillColor(MIST)
  .font("Helvetica")
  .fontSize(8.5)
  .text("Founder · Svivva  ·  svivva.com  ·  Submitted to Y Combinator", ML, doc.y, {
    width: CW,
    align: "center",
  });

/* ---------- HEADERS / FOOTERS via bufferPages ----------
   IMPORTANT: doc.text() with explicit y > (PH - MB) auto-paginates and
   creates ghost pages. To draw the footer near the bottom safely, we
   temporarily widen the bottom margin so PDFKit treats the footer y as
   "within" the content area and skips the auto-pagination check.       */
const range = doc.bufferedPageRange();
const total = range.count;
for (let i = 0; i < total; i++) {
  doc.switchToPage(i);
  if (i === 0) continue; // skip cover

  // Widen bottom margin during decoration so we can draw at the page edge.
  const savedBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;

  // top accent
  doc.save().rect(0, 0, PW, 4).fill(TEAL).restore();

  // header text
  doc
    .fillColor(MIST)
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("SVIVVA × Y COMBINATOR", ML, 28, { characterSpacing: 2.5, lineBreak: false });
  doc
    .fillColor(MIST)
    .font("Helvetica")
    .fontSize(7.5)
    .text("Application Brief", ML, 28, { width: CW, align: "right", lineBreak: false });
  doc
    .save()
    .moveTo(ML, 44)
    .lineTo(PW - MR, 44)
    .strokeColor("#E5E5E0")
    .lineWidth(0.4)
    .stroke()
    .restore();

  // footer
  const fy = PH - 36;
  doc
    .fillColor(MIST)
    .font("Helvetica")
    .fontSize(7.5)
    .text("svivva.com  ·  the bloom between code and intuition", ML, fy, {
      width: CW,
      align: "left",
      lineBreak: false,
    });
  doc.text(`${i} / ${total - 1}`, ML, fy, { width: CW, align: "right", lineBreak: false });

  doc.page.margins.bottom = savedBottom;
}

doc.end();
console.log("Wrote:", OUT, "pages:", total);
