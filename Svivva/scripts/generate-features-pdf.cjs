const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 60, bottom: 60, left: 50, right: 50 },
});

const outputPath = path.join(__dirname, "..", "public", "Svivva_Platform_Features.pdf");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
doc.pipe(fs.createWriteStream(outputPath));

const teal = "#5BA8A0";
const burgundy = "#6B2C4A";
const dark = "#1a1a1a";
const gray = "#555555";
const lightGray = "#888888";

function heading(text, size = 20) {
  doc.fontSize(size).fillColor(burgundy).font("Helvetica-Bold").text(text);
  doc.moveDown(0.3);
  doc
    .strokeColor(teal)
    .lineWidth(1.5)
    .moveTo(doc.x, doc.y)
    .lineTo(doc.x + 200, doc.y)
    .stroke();
  doc.moveDown(0.6);
}

function subheading(text) {
  doc.fontSize(13).fillColor(dark).font("Helvetica-Bold").text(text);
  doc.moveDown(0.2);
}

function body(text) {
  doc.fontSize(10).fillColor(gray).font("Helvetica").text(text, { lineGap: 3 });
  doc.moveDown(0.4);
}

function bullet(text) {
  doc.fontSize(10).fillColor(gray).font("Helvetica").text(`•  ${text}`, { indent: 15, lineGap: 2 });
}

function spacer(n = 0.5) {
  doc.moveDown(n);
}

function checkPage(needed = 100) {
  if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
}

doc.fontSize(28).fillColor(burgundy).font("Helvetica-Bold").text("SVIVVA", { align: "center" });
doc
  .fontSize(12)
  .fillColor(teal)
  .font("Helvetica")
  .text("AI API Builder & Innovation Platform", { align: "center" });
spacer(0.3);
doc
  .fontSize(9)
  .fillColor(lightGray)
  .font("Helvetica")
  .text("Complete Feature Reference Guide", { align: "center" });
spacer(0.2);
doc.fontSize(8).fillColor(lightGray).text("svivva.com", { align: "center" });

spacer(1.5);
doc.strokeColor(teal).lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
spacer(1);

heading("1. CORE PLATFORM — Prompt-to-API Engine");
subheading("Prompt-to-API Generation");
body(
  "Transform natural language descriptions into fully functional, production-ready AI API endpoints. No coding required — describe what you want and Svivva builds it.",
);
checkPage();
subheading("Schema Enforcement");
body(
  "Strict JSON Schema validation on every API response with AI-powered auto-repair. Guarantees 100% valid, structured output every time.",
);
checkPage();
subheading("Auto-Generated Evaluations");
body(
  "AI automatically creates 50–200 diverse test cases per endpoint, covering edge cases, adversarial inputs, and boundary conditions for comprehensive quality assurance.",
);
checkPage();
subheading("Version Control & Instant Rollback");
body(
  "Every modification creates a new version with full history. Automated rollback triggers when evaluation pass rates drop below configured thresholds.",
);

spacer(1);
checkPage(200);
heading("2. API MANAGEMENT");
subheading("OpenAPI Export");
body(
  "Automatically generates OpenAPI 3.0 specifications for seamless integration with any API ecosystem, documentation tools, or third-party platforms.",
);
checkPage();
subheading("SDK Generation");
body(
  "Auto-generates client SDKs for Python and Node.js, giving developers plug-and-play code to integrate Svivva APIs into their applications.",
);
checkPage();
subheading("API Key Management");
body(
  "Secure API key creation, rotation, and revocation. Manage access credentials with full audit trails.",
);
checkPage();
subheading("Real-Time Usage Monitoring");
body(
  "Live analytics dashboard tracking latency, cost, error rates, and token usage. Configurable alerts via email/Slack and webhooks for API events.",
);
checkPage();
subheading("Instant Deployment");
body(
  "Deploy API endpoints in seconds with auto-scaling infrastructure. Zero configuration required — handles any load automatically.",
);

spacer(1);
checkPage(200);
heading("3. NEURAL AI PIPELINE");
subheading("Prompt Optimization");
body(
  "AI analyzes and improves system prompts for better accuracy, consistency, and performance. Suggests rewrites with measurable quality improvements.",
);
checkPage();
subheading("Schema Enhancement");
body(
  "AI-powered suggestions for refining output schemas — tighter validation, better field naming, and improved data structures.",
);
checkPage();
subheading("Quality Gate");
body(
  "Automatic confidence scoring for every API output. Flags low-confidence responses before they reach end users.",
);
checkPage();
subheading("Training Augmentation");
body(
  "Synthetic data generation using five distinct strategies to expand training datasets. Improves model performance without manual data collection.",
);
checkPage();
subheading("Anomaly Detection");
body(
  "AI-driven identification of failure patterns in API logs. Surfaces recurring issues, edge case clusters, and degradation trends.",
);

spacer(1);
checkPage(200);
heading("4. ADVANCED AI TOOLS");
subheading("A/B Testing");
body(
  "Split traffic between different prompt versions to compare performance. Data-driven decisions about which prompts work best in production.",
);
checkPage();
subheading("Fine-Tuning Pipeline");
body(
  "Train custom AI models directly within the platform using your accumulated data and evaluation results.",
);
checkPage();
subheading("Cost Optimizer");
body(
  "AI-powered model suggestions and budget capping. Automatically recommends cheaper models that maintain quality thresholds.",
);
checkPage();
subheading("Chaos Mode");
body(
  "Adversarial stress testing that bombards your API with edge cases, malformed inputs, and extreme scenarios. Produces a resilience score.",
);
checkPage();
subheading("Prompt Breeding");
body(
  "Genetic evolution of prompts — combines the best-performing versions to create optimized offspring prompts through iterative selection.",
);
checkPage();
subheading("API Autopsy");
body(
  "Forensic analysis of API failures. Traces root causes across the full pipeline — prompt, schema, model, and infrastructure layers.",
);

spacer(1);
checkPage(200);
heading("5. COLLABORATION & MARKETPLACE");
subheading("Team Management");
body(
  "Role-based access control with four permission levels: Owner, Admin, Member, and Viewer. Full team collaboration on API projects.",
);
checkPage();
subheading("API Marketplace");
body(
  "Publish, discover, and monetize AI APIs. List your endpoints for others to use, or browse the marketplace for pre-built solutions.",
);

spacer(1);
checkPage(200);
heading("6. IDEA ENGINE");
body(
  "AI-powered discovery of untapped business opportunities across digital and physical product categories.",
);
bullet("Multi-stage pipeline: Market Scan → Gap Analysis → Idea Generation → Scoring");
bullet("Generates 6 novel ideas per session with novelty, revenue, and feasibility scores");
bullet("Identifies market gaps and competitive insights");
bullet("Supports industry filtering and custom context");
bullet("Stores session history for revisiting past discoveries");

spacer(1);
checkPage(200);
heading("7. SVIVVA PLAY — AI Music Instrument");
body(
  "A standalone AI-powered music production instrument built into the platform with professional-grade sound synthesis.",
);
checkPage();
subheading("6 Performance Modes");
bullet("Composition — AI-assisted song creation and arrangement");
bullet("Interpolation — Morph between sounds and musical ideas in real time");
bullet("Chord Player — Intelligent chord voicing and progression generator");
bullet("Solo Prompt — Describe a sound in natural language, hear it instantly");
bullet("Patch Creator — Design custom synthesizer patches with AI guidance");
bullet("Ensemble — Layer and orchestrate multiple AI instruments together");
spacer(0.3);
body(
  "Built on Tone.js sound engine with neural audio infrastructure, MIDI support, and export capabilities.",
);

spacer(1);
checkPage(200);
heading("8. PHYSICAL / HARDWARE SIDE");
body(
  "Svivva's physical platform mirrors the digital side, enabling hardware prototyping and manufacturing.",
);
bullet("AI-generated schematics and technical specifications");
bullet("Smart material sourcing with supplier network integration");
bullet("3D model generation from descriptions");
bullet("Real-time budget tracking and cost estimation");
bullet("Bill of materials (BOM) management");
bullet("Production-ready documentation export");

spacer(1);
checkPage(200);
heading("9. THE B.U.I.L.D. SYSTEM");
body(
  "Svivva's 5-step guided process — Bring Users Into Logical Delivery — takes projects from concept to completion on both digital and physical sides.",
);
spacer(0.3);
subheading("Digital Flow");
bullet("Step 1: Define — Describe your API in natural language");
bullet("Step 2: Configure — Set schema, parameters, and constraints");
bullet("Step 3: Evaluate — Auto-generated tests validate quality");
bullet("Step 4: Deploy — One-click production deployment");
bullet("Step 5: Monitor — Live performance tracking and alerts");
spacer(0.3);
subheading("Physical Flow");
bullet("Step 1: Describe — Define your hardware product concept");
bullet("Step 2: Design — AI generates schematics and specs");
bullet("Step 3: Source — Smart material and supplier matching");
bullet("Step 4: Budget — Real-time cost tracking and optimization");
bullet("Step 5: Manufacture — Production-ready documentation");

spacer(1);
checkPage(150);
heading("10. PRICING TIERS");
spacer(0.3);
subheading("Free — $0");
bullet("Digital + Physical access");
bullet("3 API endpoints / 2 hardware projects");
bullet("1,000 API requests/month");
bullet("Basic schematics export");
bullet("Svivva Play — limited access");
bullet("Community support");
spacer(0.3);
checkPage();
subheading("Pro — $49/month");
bullet("Digital + Physical unlimited");
bullet("Unlimited API endpoints & hardware projects");
bullet("100,000 API requests/month");
bullet("AI material sourcing & 3D model generation");
bullet("Svivva Play — full access");
bullet("Auto-rollback & versioning");
bullet("Priority support");
spacer(0.3);
checkPage();
subheading("Enterprise — $299/month");
bullet("Everything in Pro");
bullet("Unlimited API requests");
bullet("Dedicated supplier network");
bullet("SSO & SAML");
bullet("Custom integrations & SLA guarantee");

spacer(1.5);
doc.strokeColor(teal).lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
spacer(0.5);
doc
  .fontSize(9)
  .fillColor(lightGray)
  .font("Helvetica")
  .text("Svivva — AI API Builder & Innovation Platform", { align: "center" });
doc.fontSize(8).fillColor(lightGray).text("svivva.com  |  hello@svivva.com", { align: "center" });

doc.end();
console.log("PDF generated:", outputPath);
