# Svivva - AI API Builder SaaS

## Overview

Svivva is a SaaS platform designed to transform user prompts into production-ready AI APIs. It provides a comprehensive suite of features including schema-enforced JSON responses, automated evaluations, version control with instant rollback, and robust team collaboration tools. The platform also offers an API marketplace, A/B testing capabilities, and cost optimization features, aiming to streamline the development and deployment of AI-powered applications.

## User Preferences

- Clean, minimal design with Three.js flower background (35-40% opacity)
- Svivva branding throughout (teal #5BA8A0, burgundy #6B2C4A)
- Dark mode support
- Apple-like user-friendly UI: simple, guided, no clutter

## Dashboard Onboarding

- **New users** (no projects): Centered "What have you been sitting on?" welcome with two paths (Software/Hardware) featuring CSS 3D animated visual cards, plus "Browse around first" fallback.
- **Returning users** (have projects): Large visual tool cards with CSS 3D floating shapes (cubes, spheres, rings, pyramids) for each feature — makes it obvious what each section does. Projects below.
- **Sidebar**: Apple-minimal — 4 groups (Home/Projects, Build, Grow, Settings). ~6-7 items total. Pulse/Collaborate removed from sidebar but remain accessible via dashboard cards + command palette search. Orbit admin-only.
- **Command Palette**: Global search bar (⌘K / Ctrl+K) in header. Filters by title/keywords, grouped by section. Admin-only items hidden for non-admin users. Created in `components/command-palette.tsx`.
- **Mobile-first**: All builder pages (API Builder, Hardware Builder, Launch Studio) fully usable on phones. iOS zoom prevention (16px min inputs), stacked navigation buttons on mobile, responsive progress indicators, touch-friendly tap targets (44px+). Dashboard cards use 2-column grid on mobile.
- **Seeds Deploy**: Built seeds (with generated code) show a "Deploy" button that opens a deploy dialog. Users can download a ready-to-run ZIP of the project, with instructions for deploying to Replit, Vercel, or Railway. The dialog also links to the Marketing Funnel to auto-generate SEO pages post-deploy. API route at `/api/seeds/deploy` with ownership verification and path sanitization.
- Stats cards and the 6-card quick actions grid were removed — they overwhelmed new users with zeros and jargon.

## System Architecture

The platform is built on a modern full-stack architecture using **Next.js 16 App Router** with **TypeScript** for the frontend, styled with **Tailwind CSS** and **shadcn/ui components**. The backend leverages **Next.js API Routes**. Data persistence is managed by **PostgreSQL** with **Drizzle ORM**.

Key architectural decisions and features include:

- **Prompt-to-API Generation**: Users define AI APIs directly from natural language prompts.
- **Schema Enforcement**: Strict JSON Schema validation with AI-powered auto-repair mechanisms.
- **Automated AI Workflows**:
  - AI-driven generation and grading of training examples.
  - Automatic generation of 50-200 diverse evaluation cases per endpoint, including edge and adversarial scenarios.
  - Automated evaluation runner with instant rollback capabilities if pass rates fall below thresholds.
- **Version Control & Rollback**: Every modification creates a new version, enabling instant rollbacks to previous states.
- **API Management**:
  - **OpenAPI Export**: Generation of OpenAPI 3.0 specifications for seamless integration.
  - **SDK Generation**: Auto-generation of client SDKs for Python and Node.js.
  - **API Key Management**: Secure API key rotation.
  - **Usage Monitoring**: Real-time analytics for latency, cost, and error rates, alongside configurable usage alerts via email/Slack and webhooks for API events.
- **Collaboration & Marketplace**:
  - **Team Management**: Role-based access control (owner, admin, member, viewer).
  - **API Marketplace**: A platform for publishing, discovering, and monetizing AI APIs.
- **Advanced AI Optimization & Analysis**:
  - **A/B Testing**: Facilitates traffic splitting between different prompt versions for performance comparison.
  - **Fine-tuning Pipeline**: Supports training custom AI models.
  - **Cost Optimizer**: Provides model suggestions and budget capping for cost management.
  - **Neural AI Pipeline**: A suite of AI-powered tools for:
    - **Prompt Optimization**: AI analysis and improvement of system prompts.
    - **Schema Enhancement**: AI suggestions for refining output schemas.
    - **Quality Gate**: Automatic confidence scoring for every API output.
    - **Training Augmentation**: Synthetic data generation using five distinct strategies.
    - **Anomaly Detection**: AI-driven identification of failure patterns in logs.
  - **Chaos Mode**: Adversarial stress testing with resilience scoring.
  - **Prompt Breeding**: Genetic evolution of prompts by combining versions.
  - **API Autopsy**: Forensic analysis of API failures to identify root causes.
- **Svivva Seeds**: Multi-application generation engine that builds multiple production-ready apps from a single structured PDF.
  - PDF ingestion and parsing into separate application build units
  - Parallel build orchestration for concurrent app generation
  - Generates frontend, backend, database, auth, and deployment config per app
  - Engineering documentation extraction (API docs, architecture, deployment guides)
  - Marketing content extraction (landing pages, pitch decks, app store descriptions)
  - **Multi-App Prompt Editing**: Select multiple seeds and apply a single AI prompt to edit all their specs simultaneously in parallel. Edits invalidate stale artifacts and reset status to "parsed" so users can rebuild.
  - **Auto App Marketing Engine**: "Launch Marketing" button per session generates 3 programmatic SEO landing pages per seed app (main, generator, online variants) stored in seoLandingPages table with category="seed-marketing". Pages auto-published at root-level slugs, sitemap pinged to Google on generation. Links shown live on each SeedCard.
  - **Marketing Funnel Setup**: Collapsible "Auto Marketing Funnel Setup" panel in Seeds page. Replit account linked **automatically at login** via OIDC access_token (stored to `seed_credentials.replitToken` in auth callback — no manual PAT needed). GoDaddy (API key+secret+domain → verify domain + add DNS record), and Google Search Console (site URL → submit sitemap). Credentials stored per-user in `seed_credentials` DB table. API routes: `/api/seeds/credentials` (GET/POST), `/api/seeds/replit-apps` (POST), `/api/seeds/godaddy-setup` (POST).
  - **Launch Campaign Strategy**: Seeds supports rapid launch campaigns inspired by proven SaaS playbooks:
    - **Pre-launch phase (3-4 weeks):** Story-driven email sequences building curiosity about multi-app generation, no pricing revealed
    - **Warm-up content:** Blog posts, social posts, demo videos explaining the vision without revealing product details
    - **Launch announcement:** Limited-time early access program (not infinite free tier), creating urgency to sign up
    - **Early adopter community:** Target 500+ power users for feedback and word-of-mouth marketing
    - **Momentum strategy:** Time-bound access ensures committed users who become evangelists and provide product feedback
  - Available on Pro and Enterprise tiers only
- **Hypothesis Lab** (`/dashboard/hypothesis`): AI-powered hypothesis-as-a-service discovery engine implementing all 5 core features:
  1. **API Registry**: Users register external APIs with endpoint URL, input schema (JSON), sample response — shown alongside Svivva projects as selectable cards with schema/sample badges
  2. **Hypothesis Generation Engine**: LLM generates 4-6 hypotheses per session covering correlations, inverse relationships, anomalies, conditional behaviors, and dependencies
  3. **Experiment Engine**: Each hypothesis includes a designed experiment with 3 input scenarios, API call order, and expected behaviors — all visible in expandable detail view
  4. **Insight Validation Engine**: Per-hypothesis validation shows patterns found, contradictions detected, statistical notes, and confidence scores (0-100 with heuristic scale)
  5. **Insight Memory**: localStorage-based storage (`svivva_hypothesis_memory`, max 50). Duplicate detection warns on same question+APIs combo. Incremental learning sends up to 20 previous confirmed insights as context for new discoveries
  - Additional: Remix (edit question + reselect APIs), Insight Feed (clickable, remixable, deletable), Turn into API (prefills API Builder). No DB tables needed.
- **Hypothesis Lab — Hardware Edition** (`/dashboard/hypothesis-hardware`): Physical-side innovation engine that connects hardware components, digital APIs, Seeds apps, and external data to discover cross-ecosystem innovations for manufacturers. Same 5-core-feature architecture as digital version but with:
  - Hardware context step (product type, materials, industry, constraints)
  - Source Registry supports 3 types: Hardware Components (sensors, boards, materials), External APIs, and Seeds Apps — plus auto-connects all user's digital Svivva APIs
  - Categories: material_innovation, process_optimization, iot_integration, cross_domain, supply_chain, hybrid_product
  - Innovation score per hypothesis + cost impact analysis in validation
  - Actions: Build Hardware (routes to Hardware Builder), Turn into API (routes to API Builder), Remix
  - Separate localStorage keys: `svivva_hypothesis_hardware_memory`, `svivva_hypothesis_hardware_components`
  - Available on physical side sidebar under Discover
- **Pulse**: Automated intelligence dashboard that analyzes user account data (projects, API calls, eval scores, latency, tokens) and generates AI-powered insights, growth opportunities, risk alerts, and actionable recommendations. Cached per-user (3 min TTL) to manage costs. Located at `/dashboard/pulse` with API at `/api/pulse`. Does not send project descriptions to AI — only names and numeric data.
- **Idea Engine**: AI-powered discovery of untapped opportunities available on both digital and physical sides.
  - Multi-stage pipeline: Market Scan → Gap Analysis → Idea Generation → Scoring → Complete
  - Generates 6 novel ideas per session with novelty/revenue/feasibility scores
  - Identifies market gaps and competitive insights
  - Supports industry filtering and custom context
  - Stores session history for revisiting past discoveries
- **Growth Engine** (`/dashboard/growth`): Admin-only AI marketing hub for auto-marketing Svivva, Pyracrypt, and Mini Apps.
  - **Directory Blitz**: 60+ pre-loaded directories (AI tools, SaaS, developer, PR, social, security) filterable by category. Click to submit and track status (pending/submitted/live) per product. Shows estimated monthly visitors per directory.
  - **AI Copy Engine**: One-click AI content generation across 11 content types: Twitter/X thread, Reddit post, LinkedIn post, ProductHunt launch kit, blog post outline, press release, AEO content (Answer Engine Optimization for Perplexity/ChatGPT), competitor comparison pages, podcast pitches, GitHub SEO content, email newsletter.
  - **Novel Tactics**: 8 unconventional traffic strategies — AEO, competitor keyword hijacking, GitHub SEO, micro-PR mill, podcast pitch automation, newsletter SEO, content velocity engine, embedded growth ("Powered by Svivva").
  - **Automation Log**: History of all automated tasks. Manual "Run Weekly Tasks" button.
  - **Weekly scheduler**: `server/index.ts` runs growth tasks every 7 days (sitemap pings, IndexNow) and logs each run to `growth_tasks` table.
  - DB tables: `growth_submissions`, `growth_content`, `growth_tasks`
  - API routes: `/api/growth/directories` (GET/POST), `/api/growth/content` (GET/POST), `/api/growth/tasks` (GET/POST)

- **Orbit** (`/dashboard/launchpad`): Admin-only personal marketing command center for executing the full Svivva + Mini Apps marketing strategy. Two tabs (svivva.com / Mini Apps).

  **svivva.com tab — 12 traffic steps:**
  1. `svivva-indexnow` — IndexNow key generation + URL submission to Bing/Yandex/Yahoo
  2. `svivva-seo-pages` — 20 AI-written SEO landing pages for high-intent keywords
  3. `svivva-comparisons` — 8 competitor comparison pages (Svivva vs Bubble, Retool, etc.)
  4. `svivva-blog` — 10 long-form SEO blog articles
  5. `svivva-directories` — 40-directory submission kit (Futurepedia, G2, AlternativeTo, SaaSHub, RapidAPI, etc.) with AI-generated listing content for all fields
  6. `svivva-parasite` — 5 platform-native articles for Dev.to, Hashnode, Medium, HackerNoon, Substack (high-DA parasite SEO — outranks your site instantly)
  7. `svivva-aeo` — 15 Answer Engine Optimization pages targeting Perplexity, ChatGPT Search, Gemini (direct-answer format so AI engines cite Svivva)
  8. `svivva-communities` — 8 Reddit posts (r/SideProject, r/webdev, r/ChatGPT, r/MachineLearning…) + Show HN + Indie Hackers + Discord templates
  9. `svivva-outreach` — Press release + 10 newsletter pitches (TLDR AI, Ben's Bites, JS Weekly, 4M+ reach) + 8 podcast pitches
  10. `svivva-schema` — FAQ + SoftwareApplication JSON-LD · backlink magnet roundup page · changelog page
  11. `svivva-social` — Full social launch pack (Twitter thread, LinkedIn, Product Hunt, Show HN)
  12. `svivva-submit` — Bing sitemap ping + IndexNow re-submit

  **Mini Apps tab — 5 steps:** mini-import, mini-hub, mini-cname, mini-social, mini-index

- **Build System**: Unified build interface styled like Svivva Play hardware sampler UI
  - Dark hardware aesthetic (dark backgrounds, holographic gradients, 3D tactile buttons)
  - 4 build modes: API Build, Hardware Build, Seed Build, Quick Deploy
  - Each mode has its own multi-step wizard inside the hardware-style interface
  - Holographic text animations and gradient accents matching Svivva Play design language
  - Located at `/dashboard/build`

## Dashboard Navigation

Apple-minimal sidebar (4 groups, ~8 items):

**Digital Mode**: Home, Projects | API Builder, Hypothesis Lab | Idea Engine, Launch Studio, Pulse, Collaborate | Settings, Orbit (admin-only)
**Physical Mode**: Home, Projects | Hardware Builder, Hypothesis Lab | Idea Engine, Collaborate | Settings

## Interactive Tutorial System

- Non-intrusive tooltip-based tutorials on every major page (Dashboard, API Builder, Hardware Builder, Hypothesis Lab, Idea Engine, Launch Studio, Collaborate)
- First visit: asks "Want a quick tour?" — user can accept or decline
- If accepted: shows 3 contextual tips per page in a small bottom-right card with progress bar
- "Turn off tutorials" link on every tooltip permanently disables them
- All preferences stored in localStorage (`svivva_tutorials_disabled`, `svivva_tutorials_seen`, `svivva_tutorial_asked`)
- Component: `components/tutorial-system.tsx` (TutorialProvider + TutorialToggle)

## Real-Time Collaboration (`/dashboard/collaborate`)

- 3-tab layout: Team, Activity, Comments
- **Team tab**: Invite members by email, see pending invites, view team members with online status indicators
- **Activity tab**: Shared projects list, recent team activity feed
- **Comments tab**: Post comments/updates, threaded discussion, delete own comments
- Integrates with existing `/api/teams` backend for team data
- Local state (comments, invites) in localStorage for instant interaction

## Hardware Builder Features

- **BUILD System** (5 steps): Bring → Users → Into → Logical → Delivery
- **Step 5 (Delivery)** includes:
  - Manufacturing Checklist (6 items)
  - AI Manufacturer Research: Finds specific companies, material suppliers, and platforms with costs, MOQs, lead times, and websites (`POST /api/hardware/manufacturers`)
  - Cross-Domain Hybridizer: Combines two hardware systems to generate 3-5 hybrid concepts with emergent behaviors, novelty scores, and feasibility ratings (`POST /api/hardware/hybridize`)
  - PDF Blueprint Download: Generates a professional manufacturing blueprint PDF with all product specs, manufacturers, suppliers, platforms, recommendations, and hybrid concepts (`POST /api/hardware/blueprint`, uses pdfkit)
- Products saved to localStorage (`svivva_hardware_products`) on "Complete Build"

The project structure is organized into `app/` (API routes, dashboard, runtime), `lib/` (database schema, Drizzle DB, repositories, ProjectSpec system, LLM helpers), `components/` (UI components), and `design_guidelines.md`. The database schema includes 48 tables covering core project data, evaluations, API management, teams, marketplace, A/B testing, fine-tuning, cost management, neural AI pipeline components, idea engine, blog posts, SEO landing pages, and page categories.

## Launch Studio (`/dashboard/launch-studio`)

User-facing AI marketing toolkit in the Discover section. Authenticated users describe their app and generate:

- **Marketing Plan**: Tagline, value props, channel strategies with priorities, launch checklist, content ideas, and mini app concepts
- **Landing Page**: Hero copy, features, testimonials, FAQ, and CTA — with "Copy as HTML" export
- **Social Posts**: Platform-specific posts for Twitter/X, LinkedIn, Reddit, and Product Hunt with hashtags
- API route: `POST /api/launch-studio` (authenticated, Zod-validated input, safe JSON parsing)

## SEO & Marketing Infrastructure

- **Blog**: Server-rendered at `/blog` and `/blog/[slug]` with generateMetadata, JSON-LD structured data, category filters, related posts, CTA sections
- **Programmatic SEO Tools**: Server-rendered at `/tools`, `/tools/[slug]`, `/tools/category/[slug]` using direct Drizzle ORM queries
- **Conversion Landing Pages**: Static ad-optimized pages at `/lp/[slug]` (ai-api-builder, prompt-to-api, ai-app-generator)
- **robots.txt**: Dynamic via `app/robots.ts`, allows /blog, /tools, /lp; blocks /dashboard, /api, /play, /seeds
- **sitemap.xml**: Dynamic via `app/sitemap.ts`, pulls all published content from DB
- **Google Analytics**: GA4 via `NEXT_PUBLIC_GA_ID` env var, Google Ads via `NEXT_PUBLIC_GADS_ID` env var; both injected in layout.tsx
- **Conversion Tracking**: `lib/analytics.ts` provides trackSignup, trackAppCreation, trackUpgrade, trackButtonClick; events fire to GA4 and Google Ads (when configured)
- **Tracked CTAs**: `components/tracked-cta.tsx` wraps Link with click tracking for landing page CTA buttons
- **Admin Content Management**: Dashboard at `/dashboard/content` with tabs for Blog Posts, SEO Pages, Categories
- **Seed Content**: `lib/seed-content.ts` populates 5 blog posts, 10 SEO tool pages, 4 categories (idempotent, runs when pageCategories empty)
- All SEO pages are public (middleware exempts /blog, /tools, /lp, and single-segment root paths from site gate)

## APEX — Autonomous Prompt Evolution eXecutor

- **Feature**: Self-improving APIs — after deploy, APEX continuously monitors real traffic, detects failure patterns, generates improved prompts via GPT, evaluates them against the existing test suite, and auto-promotes if quality improves (≥5pt score delta). Fully reversible per-cycle.
- **Loop**: Observe (apex_call_logs) → Analyze (failure pattern via GPT) → Hypothesize (improved prompt) → Evaluate (score both on eval cases) → Promote (new projectVersion + update project) → Learn (cycle record)
- **Tables**: `apex_call_logs` (every live /api/run call), `apex_cycles` (each cycle: pattern, score before/after, promoted, rolledBack)
- **Routes**: `POST /api/apex/[projectId]/cycle` (trigger), `GET /api/apex/[projectId]/cycles` (history), `POST /api/apex/[projectId]/rollback/[cycleId]`
- **Engine**: `lib/apex/engine.ts` exports `runApexCycle()` and `rollbackApexCycle()`
- **UI**: `/dashboard/projects/[id]/apex` — full cycle history, scores, diffs, rollback buttons
- **Call logging**: Every `/api/run/[slug]` POST now fire-and-forgets a log insert into `apex_call_logs`
- **Projects page**: Purple "APEX" badge link on every project card

## SEO Growth Dashboard

- **Keyword Planner**: Dashboard at `/dashboard/keywords` for managing SEO keywords with search volume, intent, status tracking
- **AI Landing Page Generator**: POST `/api/generate/landing-page` uses OpenAI to generate full SEO landing pages from keywords, saves to seoLandingPages with FAQ embedded
- **AI Article Generator**: POST `/api/generate/article` uses OpenAI to generate blog articles from keywords, saves to blogPosts
- **Root-Level SEO Pages**: Dynamic route at `app/(seo)/[slug]/page.tsx` renders published landing pages at root URLs (e.g., `/ai-app-builder`)
- **Database**: `seo_keywords` table tracks keywords with searchVolume, intent, assignedPage, assignedArticle, status

## Svivva Play (`/play`)

Music composition and chord exploration tool with hardware-sampler UI aesthetic.

- **Active Modes**:
  - **Chord Player**: Browse 500+ chord voicings (neo-soul, jazz, Brazilian, gospel, quartal, etc.) with diatonic analysis, inversions, and MIDI output. Powered by `lib/svivva-play/chordkit.ts` (ported from ChordKit JS).
  - **Composition**: Counterpoint (3-voice interlocking canons) and Hocketing (6-voice alternating texture) generator. Three styles: Electric Counterpoint, Shaw Interlace, Phase Canon. 25+ world/jazz/Indian scales. Powered by `lib/svivva-play/reich-engine.ts` (ported from Python Reich composer).
- **Coming Soon Modes**: Interpolation, Solo Prompt, Patch Creator, Ensemble (disabled with lock icons)
- **Audio Analysis**: Key detection (Krumhansl-Schmuckler), tempo/BPM detection, chord timeline, section detection via `lib/svivva-play/audio-analysis.ts`
- **Sound Engine**: Web Audio API playback with stem mixer via `lib/svivva-play/sound-engine.ts`
- **Existing Chord Engine**: Neo-soul voicing generator via `lib/svivva-play/chord-engine.ts`
- **API Routes**: `/api/svivva-play/analyze`, `/api/svivva-play/generate`, `/api/svivva-play/export`

## Hardware Builder — Logical step

Step 4 (Logical) of the BUILD wizard:

- **Layout preview**: `SchematicViewer` shows illustrative dimensions from the brief (not CAD / not AI 3D).
- **Optional AI sketch**: Text-to-image via DALL-E 3 when the user is signed in and OpenAI is configured. API: `POST /api/hardware/sketch` (`lib/llm/openai.ts`). Spline iframe 3D preview was removed (unreliable / not AI-generated).

## Custom Checkout (`/dashboard/checkout`)

Embedded Stripe Elements checkout page replacing Stripe's hosted checkout:

- Plan summary sidebar with features, pricing, test card reference
- Stripe PaymentElement with dark theme matching Svivva branding
- Three.js blooming flowers decorative banner at top (checkout preset): reference-matching colors (blush pink, chartreuse, sage green, lavender) with holographic "S VIVVA" text on petals via canvas texture + shader overlay
- Design preview mode: visit `/dashboard/checkout` directly to see layout without triggering payment
- Live mode: routed from billing page with `?tier=pro&priceId=...` query params
- API routes: `GET /api/stripe/publishable-key`, `POST /api/stripe/create-payment-intent`
- Uses `@stripe/stripe-js` and `@stripe/react-stripe-js` for embedded Elements

## External Dependencies

- **AI**: OpenAI GPT-5 (via Replit AI Integrations)
- **Authentication**: Replit Auth
- **Payments**: Stripe
- **Validation**: Zod, Ajv (for JSON Schema validation)
