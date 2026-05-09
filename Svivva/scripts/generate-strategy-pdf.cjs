const PDFDocument = require("pdfkit");
const fs = require("fs");

const doc = new PDFDocument({
  size: "letter",
  margins: { top: 60, bottom: 60, left: 60, right: 60 },
  info: {
    Title: "Svivva Customer Acquisition Strategy",
    Author: "Svivva",
    Subject: "Growth Blueprint",
  },
});

const output = fs.createWriteStream("svivva-growth-strategy.pdf");
doc.pipe(output);

const TEAL = "#5BA8A0";
const BURGUNDY = "#6B2C4A";
const DARK = "#1a1a2e";
const GRAY = "#555555";
const LIGHT = "#f8f8f8";

function addHeader(text, size = 22) {
  doc.fontSize(size).fillColor(DARK).font("Helvetica-Bold").text(text);
  doc.moveDown(0.3);
  doc
    .moveTo(doc.x, doc.y)
    .lineTo(doc.x + 490, doc.y)
    .strokeColor(TEAL)
    .lineWidth(2)
    .stroke();
  doc.moveDown(0.6);
}

function addSubHeader(text) {
  doc.fontSize(14).fillColor(BURGUNDY).font("Helvetica-Bold").text(text);
  doc.moveDown(0.3);
}

function addBody(text) {
  doc.fontSize(10.5).fillColor(GRAY).font("Helvetica").text(text, { lineGap: 3 });
  doc.moveDown(0.4);
}

function addBullet(text) {
  const x = doc.x;
  doc.fontSize(10.5).fillColor(TEAL).font("Helvetica-Bold").text("\u2022 ", { continued: true });
  doc.fillColor(GRAY).font("Helvetica").text(text, { lineGap: 2 });
  doc.moveDown(0.15);
}

function addNumbered(num, title, desc) {
  doc.fontSize(11).fillColor(TEAL).font("Helvetica-Bold").text(`${num}. ${title}`);
  doc.fontSize(10).fillColor(GRAY).font("Helvetica").text(desc, { indent: 16, lineGap: 2 });
  doc.moveDown(0.4);
}

function checkPage(needed = 120) {
  if (doc.y > 660 - needed) doc.addPage();
}

// ─── COVER PAGE ────────────────────────────────────────────────────────
doc.rect(0, 0, 612, 792).fill(DARK);

doc
  .fontSize(42)
  .fillColor("#ffffff")
  .font("Helvetica-Bold")
  .text("SVIVVA", 60, 220, { align: "center" });
doc.moveDown(0.3);
doc
  .fontSize(11)
  .fillColor(TEAL)
  .font("Helvetica")
  .text("AI API BUILDER", { align: "center", characterSpacing: 6 });
doc.moveDown(2);

doc.moveTo(200, doc.y).lineTo(412, doc.y).strokeColor(TEAL).lineWidth(1).stroke();
doc.moveDown(1.5);

doc
  .fontSize(22)
  .fillColor("#ffffff")
  .font("Helvetica-Bold")
  .text("Customer Acquisition", { align: "center" });
doc.fontSize(22).fillColor(TEAL).text("Growth Strategy", { align: "center" });
doc.moveDown(1.5);

doc
  .fontSize(11)
  .fillColor("#aaaaaa")
  .font("Helvetica")
  .text("A Vertical SaaS Playbook for Svivva", { align: "center" });
doc.moveDown(0.3);
doc.text("Adapted from proven $365K/mo MRR models", { align: "center" });
doc.moveDown(0.3);
doc.text("with market research and AI-native strategies", { align: "center" });

doc
  .fontSize(9)
  .fillColor("#666666")
  .text("Confidential \u2022 hello@svivva.com", 60, 720, { align: "center" });

// ─── PAGE 2: EXECUTIVE SUMMARY ────────────────────────────────────────
doc.addPage();
addHeader("Executive Summary");

addBody(
  "This document outlines a customer acquisition strategy for Svivva, adapted from a proven SaaS model that generates $365K/month in recurring revenue with 1,100+ subscribers. The core insight: vertical SaaS companies that pick a specific niche, solve their exact pain points, and automate the onboarding experience consistently outperform horizontal platforms.",
);

addBody(
  "Svivva's unique position \u2014 an AI-powered platform that turns natural language into production-ready APIs \u2014 makes it ideal for vertical targeting. Rather than competing with every API builder on the market, Svivva can own specific verticals where non-technical founders and small teams need APIs but lack the engineering resources to build them.",
);

doc.moveDown(0.3);
addSubHeader("The Core Model (Adapted for Svivva)");
addBullet("Pick 1\u20132 underserved verticals where people need APIs but can't build them");
addBullet("Position Svivva as the vertical-specific solution (not a generic tool)");
addBullet('Create niche-specific templates, prompts, and pre-built API "snapshots"');
addBullet("Automate onboarding so users get value within 5 minutes");
addBullet("Use content marketing + community to build authority in those verticals");
addBullet("Scale through referrals, partnerships, and paid acquisition once proven");

doc.moveDown(0.5);
addSubHeader("Key Market Data");
addBullet("Vertical SaaS market: $94.86B and growing 2x faster than horizontal platforms");
addBullet("71% of organizations now use generative AI in at least one function");
addBullet("Vertical SaaS companies report 35\u201360% higher retention rates");
addBullet("Niche-focused companies spend 88% less on marketing than broad platforms");
addBullet("Vertical platforms achieve 8x cheaper customer acquisition costs");

// ─── PAGE 3: THE BLUEPRINT ────────────────────────────────────────────
doc.addPage();
addHeader("The Blueprint: What the $365K/mo Model Does Right");

addBody(
  "The YouTube case study (GoHighLevel contractor SaaS) reveals a repeatable pattern that maps directly onto Svivva. Here's what makes it work and how we adapt each piece:",
);

doc.moveDown(0.3);
addSubHeader("1. Extreme Niche Focus");
addBody(
  'The model doesn\'t sell "CRM software." It sells "CRM software for HVAC contractors." This specificity means every feature, every piece of marketing copy, and every onboarding email speaks directly to one type of buyer. The contractor feels like the product was built for them \u2014 because it was.',
);

addBody(
  'Svivva adaptation: Don\'t sell "AI API builder." Sell "AI APIs for real estate agents who need automated property valuations" or "AI APIs for fitness studios that need personalized workout generators." Same platform, completely different positioning.',
);

checkPage();
addSubHeader('2. Pre-Built "Snapshots" (Templates)');
addBody(
  'GoHighLevel\'s most powerful growth lever is "snapshots" \u2014 pre-configured setups that give new users a fully working system on day one. The contractor logs in and already has a job pipeline, review automation, and appointment booking ready to go. Zero setup friction.',
);

addBody(
  'Svivva adaptation: Create API "starter kits" for each vertical. A real estate agent signs up and immediately has a working property valuation API, a lead qualification API, and a listing description generator API \u2014 all pre-configured with the right prompts and schemas. They just customize and deploy.',
);

checkPage();
addSubHeader("3. Automated Onboarding That Proves Value Fast");
addBody(
  'The model uses a 30-day onboarding sequence that guides the user to a "quick win" on Day 1 (usually seeing their first missed-call text-back in action). This is critical: if a user doesn\'t see value in the first week, they churn.',
);

addBody(
  "Svivva adaptation: The moment a user signs up, they should have a working API endpoint within 5 minutes. The onboarding should walk them through: describe what you need \u2192 see the generated API \u2192 test it in the playground \u2192 copy the endpoint. Day 1 quick win = a working API they can show someone.",
);

checkPage(140);
addSubHeader("4. Pricing That Scales With The Customer");
addBody(
  "The model uses 3 tiers ($147/$297/$497) with clear feature gates. The lowest tier gets them in, the middle tier is where most people land, and the top tier is for serious operators. Usage-based add-ons (SMS, email) create additional margin.",
);

addBody(
  "Svivva's current pricing (Pro $49/mo, Enterprise $299/mo) is well-positioned. Consider adding a usage layer: charge per API call beyond the included limit. This aligns cost with value \u2014 as the customer's API gets more traffic, they pay more, and they're happy to because it means their product is working.",
);

// ─── PAGE 4: RECOMMENDED VERTICALS ───────────────────────────────────
doc.addPage();
addHeader("Recommended Verticals for Svivva");

addBody(
  "Based on market research, these are the highest-opportunity verticals where non-technical users need AI APIs but can't build them:",
);

doc.moveDown(0.3);
addSubHeader("Tier 1: Highest Opportunity");

addNumbered(
  1,
  "Real Estate & Property Tech",
  "Agents and brokers need: property valuation APIs, listing description generators, lead scoring, market analysis. They have budget ($200\u2013500/mo is nothing against a $15K commission), low technical ability, and clear pain points. Pre-built starter kit: valuation API + listing writer + lead qualifier.",
);

addNumbered(
  2,
  "Health & Wellness Practitioners",
  "Personal trainers, nutritionists, clinics need: workout plan generators, meal plan APIs, intake form processors, appointment reminders. They charge $100\u2013300/month per client and can easily justify $49\u201399/mo for automation. Pre-built starter kit: workout generator API + nutrition plan API + client intake API.",
);

addNumbered(
  3,
  "E-commerce & Shopify Store Owners",
  "Need: product description generators, review summarizers, inventory prediction APIs, customer segmentation. Millions of Shopify stores, most run by non-technical founders. Pre-built starter kit: product description API + review sentiment API + email copy generator.",
);

checkPage(140);
addSubHeader("Tier 2: Strong Opportunity");

addNumbered(
  4,
  "Legal & Compliance",
  "Small law firms need: contract clause generators, legal document summarizers, compliance checkers. High willingness to pay ($299+/mo), extreme time savings. Pre-built starter kit: contract analyzer API + clause generator + compliance checker.",
);

addNumbered(
  5,
  "Content Creators & Agencies",
  "YouTubers, podcasters, marketing agencies need: title generators, SEO analyzers, content repurposing APIs, social media post generators. High volume of potential users. Pre-built starter kit: content repurposer API + SEO scorer + social post generator.",
);

addNumbered(
  6,
  "Education & Tutoring",
  "Online tutors and ed-tech startups need: quiz generators, lesson plan APIs, student progress analyzers, personalized learning path APIs. Growing market. Pre-built starter kit: quiz generator API + lesson planner + progress analyzer.",
);

// ─── PAGE 5: ACQUISITION CHANNELS ────────────────────────────────────
doc.addPage();
addHeader("Customer Acquisition Channels");

addSubHeader("Phase 1: Foundation (Month 1\u20132) \u2014 $0 Budget");

addNumbered(
  1,
  "Niche SEO Content",
  'Create 20\u201350 pages targeting long-tail searches your vertical actually Googles. Not "best API builder" but "how to automate property valuations" or "AI workout plan generator for personal trainers." Svivva\'s Orbit system can generate these pages automatically. Each page should link to a free trial or demo.',
);

addNumbered(
  2,
  "Community Infiltration",
  'Join 5\u201310 communities where your target vertical hangs out (Reddit, Facebook groups, Slack communities, industry forums). Don\'t pitch. Answer questions. Share insights. Become the knowledgeable person who happens to have built a tool. When people ask "how do I do X?" your answer is a working API endpoint.',
);

addNumbered(
  3,
  "YouTube / Short-Form Video",
  'Create 2\u20133 videos per week showing real use cases: "I built a property valuation API in 3 minutes" or "Watch me create a workout generator API live." These compound over time and establish authority. The $365K/mo model credits YouTube as a top channel for contractor SaaS.',
);

checkPage(140);
addSubHeader("Phase 2: Acceleration (Month 3\u20136) \u2014 $500\u2013$2K/mo");

addNumbered(
  4,
  "Demo Funnel + Free Trial",
  'Build a simple funnel: Landing page \u2192 "See it in action" demo video \u2192 14-day free trial. The demo should show a complete use case for the target vertical in under 3 minutes. The trial should pre-load their vertical\'s starter kit so they see value immediately.',
);

addNumbered(
  5,
  "Partnerships With Niche Influencers",
  "Find 3\u20135 micro-influencers in your target vertical (10K\u2013100K followers). Offer them free Pro access + affiliate commission (20\u201330% recurring). One genuine testimonial from a respected industry voice converts better than $10K in ads.",
);

addNumbered(
  6,
  "Product Hunt + Indie Hackers + Hacker News",
  'Launch on Product Hunt with your vertical angle: "AI API Builder for [Niche]" not just "AI API Builder." The specificity makes you stand out. Follow up with Show HN and Indie Hackers posts showing real revenue/usage data.',
);

checkPage(140);
addSubHeader("Phase 3: Scale (Month 6\u201312) \u2014 $2K\u2013$5K/mo");

addNumbered(
  7,
  "Paid Ads (Facebook/Google)",
  'Target your vertical with specific pain-point messaging: "Stop paying $500/hr for a developer to build your property valuation tool." Use retargeting on people who visited your SEO content. Expected CAC: $50\u2013150 for a $49/mo subscriber = 1\u20133 month payback.',
);

addNumbered(
  8,
  "Referral Program",
  "Offer existing users 1 free month for every referral who subscribes. In niche verticals, word-of-mouth is powerful because practitioners know each other. The $365K/mo model reports that referrals account for 30%+ of new subscribers.",
);

addNumbered(
  9,
  "Conference & Trade Show Presence",
  'Attend 2\u20133 industry events for your vertical. Don\'t just have a booth \u2014 present. Give a talk on "How AI is changing [industry]" and demo Svivva live. One conference can yield 20\u201350 qualified leads.',
);

// ─── PAGE 6: ONBOARDING & RETENTION ──────────────────────────────────
doc.addPage();
addHeader("Onboarding & Retention Strategy");

addBody(
  "The #1 lesson from the $365K/mo model: most churn happens in the first 30 days. If a user doesn't see value fast, they're gone. Here's the Svivva-specific onboarding sequence:",
);

doc.moveDown(0.3);
addSubHeader("30-Day Onboarding Sequence");

const onboarding = [
  [
    "Day 0",
    "Account created \u2192 vertical starter kit auto-loaded \u2192 welcome email with 60-second video showing their first API working",
  ],
  [
    "Day 1",
    '"Your first API is live" email \u2192 link to test it in the Playground \u2192 show them the endpoint URL they can share',
  ],
  [
    "Day 3",
    '"Customize it" email \u2192 walk them through editing the prompt/schema to match their exact needs',
  ],
  [
    "Day 7",
    "Check-in: \"How's it going?\" \u2192 personal email or automated video. Ask what they're trying to build. Offer help.",
  ],
  [
    "Day 14",
    '"You\'ve made X API calls this week" \u2192 usage report showing their API is actually being used',
  ],
  [
    "Day 21",
    '"Level up" email \u2192 introduce advanced features (versioning, A/B testing, marketplace listing)',
  ],
  ["Day 30", "ROI summary: API calls served, estimated developer hours saved, uptime percentage"],
];

onboarding.forEach(([day, desc]) => {
  doc.fontSize(11).fillColor(TEAL).font("Helvetica-Bold").text(day, { continued: true });
  doc.fillColor(GRAY).font("Helvetica").text(` \u2014 ${desc}`, { lineGap: 2 });
  doc.moveDown(0.3);
});

checkPage(140);
doc.moveDown(0.3);
addSubHeader("Retention Tactics");

addBullet(
  'Monthly "wins report" \u2014 auto-generated email showing API calls, uptime, and estimated time saved',
);
addBullet(
  "Quarterly feature drops \u2014 email highlighting new capabilities relevant to their vertical",
);
addBullet(
  "Community access \u2014 private Slack/Discord for your vertical's Svivva users to share use cases",
);
addBullet(
  "Usage alerts \u2014 notify users when their API traffic is growing (positive reinforcement)",
);
addBullet(
  "Proactive churn detection \u2014 flag accounts with declining usage, reach out before they cancel",
);

doc.moveDown(0.5);
addSubHeader("Churn Prevention");
addBody("Monitor these signals weekly:");
addBullet("No login in 7+ days \u2192 send re-engagement email with a relevant use case");
addBullet("API calls dropping \u2192 offer a free strategy call to help them integrate");
addBullet(
  "Support ticket unanswered \u2192 escalate immediately; one bad support experience = cancellation",
);

// ─── PAGE 7: REVENUE PROJECTIONS ─────────────────────────────────────
doc.addPage();
addHeader("Revenue Projections");

addBody(
  "Based on Svivva's current pricing (Pro: $49/mo, Enterprise: $299/mo) and assuming a blended average of $89/mo per subscriber (mix of Pro and Enterprise):",
);

doc.moveDown(0.5);

const projections = [
  ["Milestone", "Subscribers", "Monthly MRR", "Annual Revenue", "Timeline"],
  ["Validation", "25", "$2,225", "$26,700", "Month 3\u20134"],
  ["Traction", "100", "$8,900", "$106,800", "Month 6\u20138"],
  ["Growth", "300", "$26,700", "$320,400", "Month 10\u201314"],
  ["Scale", "500", "$44,500", "$534,000", "Month 16\u201320"],
  ["Maturity", "1,000", "$89,000", "$1,068,000", "Month 24\u201330"],
];

const colWidths = [80, 85, 90, 105, 100];
let tableX = doc.x;
let tableY = doc.y;

projections.forEach((row, rowIdx) => {
  let cellX = tableX;
  const isHeader = rowIdx === 0;
  const bgColor = isHeader ? DARK : rowIdx % 2 === 0 ? "#f0f7f6" : "#ffffff";
  const textColor = isHeader ? "#ffffff" : GRAY;
  const font = isHeader ? "Helvetica-Bold" : "Helvetica";

  doc
    .rect(
      cellX,
      tableY,
      colWidths.reduce((a, b) => a + b, 0),
      24,
    )
    .fill(bgColor);

  row.forEach((cell, colIdx) => {
    doc
      .fontSize(9)
      .fillColor(textColor)
      .font(font)
      .text(cell, cellX + 6, tableY + 7, { width: colWidths[colIdx] - 12 });
    cellX += colWidths[colIdx];
  });
  tableY += 24;
});

doc.y = tableY + 20;

addBody(
  "These numbers are conservative. The $365K/mo GoHighLevel model reached 1,100 subscribers at $297/mo average. Svivva's lower price point means faster acquisition but requires higher volume. The key is keeping churn under 5% monthly through strong onboarding and vertical-specific value.",
);

checkPage(140);
doc.moveDown(0.3);
addSubHeader("Cost Structure");
addBullet("OpenAI API costs: ~$0.01\u20130.05 per API call (well within margin at $49/mo)");
addBullet("Infrastructure: Replit deployment covers hosting, scaling, SSL");
addBullet("Marketing: $0\u20132K/mo in Phase 1\u20132, scaling to $5K/mo with proven CAC");
addBullet("Support: 1 person can handle 100\u2013200 subscribers with good documentation");
addBullet("Target gross margin: 80\u201390% (SaaS industry standard for AI-powered tools)");

// ─── PAGE 8: 90-DAY ACTION PLAN ──────────────────────────────────────
doc.addPage();
addHeader("90-Day Action Plan");

addSubHeader("Month 1: Foundation");
addBullet("Choose primary vertical (recommendation: real estate or health/fitness)");
addBullet("Create 3 pre-built API starter kits for that vertical");
addBullet("Write 10 SEO landing pages targeting vertical-specific long-tail keywords");
addBullet("Run Orbit: generate blog posts, comparison pages, and submit to search engines");
addBullet("Set up Stripe webhook for production (complete the payment flow end-to-end)");
addBullet("Join 5 communities where your vertical audience hangs out");
addBullet("Create a demo video showing a complete use case in under 3 minutes");

doc.moveDown(0.3);
addSubHeader("Month 2: First Customers");
addBullet("Launch on Product Hunt with vertical-specific positioning");
addBullet("Post in 3\u20135 relevant communities (helpful content, not pitches)");
addBullet("Reach out to 10 people in your vertical and offer free Pro access for feedback");
addBullet("Publish 2 YouTube videos showing vertical-specific API builds");
addBullet("Set up the 30-day onboarding email sequence");
addBullet("Start collecting testimonials from beta users");
addBullet("Goal: 10\u201325 active users (mix of free and paid)");

doc.moveDown(0.3);
addSubHeader("Month 3: Validation & First Revenue");
addBullet("Analyze: which starter kits are most used? Which features get the most engagement?");
addBullet("Double down on what's working \u2014 kill what isn't");
addBullet("Contact 3 niche micro-influencers for partnerships");
addBullet("Build a simple referral program (1 free month per referral)");
addBullet("Consider testing $300\u2013500/mo in Facebook/Google ads targeting your vertical");
addBullet('Publish a case study: "How [Person] built [Thing] with Svivva in [Timeframe]"');
addBullet("Goal: 25\u201350 paying subscribers, $1K\u2013$4K MRR");

// ─── PAGE 9: WHAT MAKES SVIVVA DIFFERENT ─────────────────────────────
doc.addPage();
addHeader("Svivva's Unfair Advantages");

addBody(
  "Compared to the GoHighLevel model (which resells an existing platform), Svivva has several structural advantages:",
);

doc.moveDown(0.3);

addSubHeader("1. You Own The Product");
addBody(
  "GoHighLevel resellers are building on someone else's platform. If GoHighLevel changes pricing or features, every reseller is affected. Svivva is your technology, your codebase, your roadmap. This is a real company, not a reselling operation.",
);

addSubHeader("2. AI-Native, Not AI-Bolted-On");
addBody(
  "Most SaaS platforms are adding AI as an afterthought. Svivva was built from the ground up around AI \u2014 prompt-to-API generation, schema enforcement, auto-rollback based on evaluations. This is a fundamentally different product category.",
);

addSubHeader("3. The API Marketplace Creates Network Effects");
addBody(
  "Every API a user creates can be listed on the marketplace. As the marketplace grows, it attracts more users who want to discover and use APIs \u2014 which attracts more creators. This flywheel doesn't exist in GoHighLevel's model.",
);

addSubHeader("4. Orbit: Built-In Growth Engine");
addBody(
  "Svivva has Orbit built directly into the admin dashboard \u2014 automated SEO page generation, blog creation, IndexNow submission, comparison pages, and social media launch packs. Most SaaS founders have to hire an agency for this. You have it built in.",
);

addSubHeader("5. Lower Barrier, Higher Ceiling");
addBody(
  "At $49/mo for Pro, Svivva is accessible to solo founders and small teams. But the Enterprise tier ($299/mo) and usage-based pricing create a natural expansion path as customers grow. The GoHighLevel model starts at $497/mo \u2014 that's a harder first sell.",
);

// ─── FINAL PAGE ──────────────────────────────────────────────────────
doc.addPage();
doc.rect(0, 0, 612, 792).fill(DARK);

doc
  .fontSize(32)
  .fillColor("#ffffff")
  .font("Helvetica-Bold")
  .text("Next Steps", 60, 200, { align: "center" });

doc.moveDown(1.5);
doc.moveTo(200, doc.y).lineTo(412, doc.y).strokeColor(TEAL).lineWidth(1).stroke();
doc.moveDown(1.5);

const steps = [
  "Deploy the app to production",
  "Set up the Stripe webhook for live payments",
  "Run Orbit to generate SEO content and blog posts",
  "Choose your first vertical and create starter kits",
  "Launch in 2\u20133 niche communities",
  "Get your first 10 users and iterate",
];

steps.forEach((step, i) => {
  doc
    .fontSize(14)
    .fillColor(TEAL)
    .font("Helvetica-Bold")
    .text(`${i + 1}.`, 120, doc.y, { continued: true, width: 30 });
  doc.fillColor("#cccccc").font("Helvetica").text(` ${step}`, { lineGap: 4 });
  doc.moveDown(0.5);
});

doc.moveDown(2);
doc
  .fontSize(11)
  .fillColor("#888888")
  .font("Helvetica")
  .text("hello@svivva.com", { align: "center" });
doc.moveDown(0.3);
doc
  .fontSize(9)
  .fillColor("#666666")
  .text("Confidential \u2022 Svivva Growth Strategy \u2022 2025", { align: "center" });

doc.end();

output.on("finish", () => {
  console.log("PDF generated: svivva-growth-strategy.pdf");
});
