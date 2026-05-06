# Workspace

## Overview

pnpm workspace monorepo using TypeScript. **svivva-tools** — an engineering-as-marketing hub of 29+ AI-powered mini tools designed to drive SEO traffic to the main svivva app.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + Wouter
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2, gpt-image-1)
- **Custom font**: Zc-Regular.ttf (served from `public/fonts/`)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── ai-tools-hub/          # Main React + Vite frontend (at /)
│   │   ├── public/
│   │   │   ├── tools/         # 19 uploaded static mini-app tools
│   │   │   ├── fonts/         # Zc-Regular.ttf
│   │   │   ├── sitemap.xml    # SEO sitemap
│   │   │   └── robots.txt     # Robots file
│   │   └── src/
│   │       ├── data/tools.ts  # All tool metadata (29 tools, categories, SEO data)
│   │       ├── pages/         # Route pages
│   │       │   └── ToolPage.tsx  # Dynamic landing page for uploaded tools
│   │       └── components/
│   │           └── ToolLandingPage.tsx  # Reusable SEO landing page component
│   └── api-server/             # Express API server (at /api)
│       └── src/routes/
│           ├── tools/          # Built-in AI tool routes (OpenAI-powered)
│           └── mini-tools/     # Routes for uploaded tools with server logic
├── _uploaded_tools/            # Source ZIPs and extracted code for tools 1-19
├── lib/                        # Shared libraries
│   ├── api-spec/               # OpenAPI spec + Orval codegen config
│   ├── api-client-react/       # Generated React Query hooks
│   ├── api-zod/                # Generated Zod schemas from OpenAPI
│   ├── db/                     # Drizzle ORM schema + DB connection
│   ├── integrations-openai-ai-server/  # OpenAI server-side client
│   └── integrations-openai-ai-react/   # OpenAI React hooks
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Tool Categories (29 tools total)

### Built-in AI Tools (10 — powered by OpenAI via Replit)
AI Chat, Summarizer, Translator, Code Explainer, Grammar Checker,
Sentiment Analyzer, Keyword Extractor, Tone Rewriter, Image Generator, Quiz Generator

### AI Prompt Tools (8 — uploaded static apps)
Prompt Coverage Checker, AI Prompt Linter, AI Test Case Generator,
Prompt Drift Detector, Prompt Security Scanner, Prompt Consistency Checker,
Prompt Confidence Heatmap, Prompt Compression Tool

### Developer Tools (4 — uploaded static apps)
JSON Schema Analyzer, API Latency Calculator, JSON Repair Tool, JSON Schema Linter, Evaluation Rule Builder

### AI Model Tools (4 — uploaded static apps)
AI Model Comparison, Synthetic Dataset Generator, AI Output Diff Visualizer, Evaluation Rule Builder

### Hardware & BOM (3 — uploaded static apps)
Hardware BOM Tools, AI BOM Generator, BOM Material Sourcing

## SEO Architecture

Each uploaded tool has:
- **Landing page** at `/:slug` — React page with hero, features, steps, FAQ, marketing funnel, related tools
- **Live tool** at `/tools/:slug/` — Static HTML app served via Vite public folder
- **Structured data** JSON-LD injected per page via useEffect
- **SEO meta tags** updated per page via useEffect
- **sitemap.xml** at `/sitemap.xml` — covers all 29 tool URLs
- **robots.txt** at `/robots.txt` — allows all crawlers, references sitemap

## API Routes

### Built-in AI Tools
- `GET/POST /api/openai/conversations` - Manage conversations
- `POST /api/openai/generate-image` - Image generation
- `POST /api/tools/summarize` - Text summarization (SSE)
- `POST /api/tools/translate` - Translation (SSE)
- `POST /api/tools/code-explain` - Code explanation (SSE)
- `POST /api/tools/grammar` - Grammar checking (SSE)
- `POST /api/tools/sentiment` - Sentiment analysis (JSON)
- `POST /api/tools/keywords` - Keyword extraction (JSON)
- `POST /api/tools/tone-rewrite` - Tone rewriting (SSE)
- `POST /api/tools/quiz` - Quiz generation (JSON)

### Mini Tool Routes (pure JS analysis — no AI credits needed)
- `POST /api/tools/ai-model-comparison/analyze`
- `POST /api/tools/prompt-consistency-checker/analyze`
- `POST /api/tools/synthetic-dataset-generator/analyze`
- `POST /api/tools/ai-bom-generator/generate`

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Key Files

- `artifacts/ai-tools-hub/src/data/tools.ts` — single source of truth for all tool metadata, categories, features, steps, FAQs, slugs
- `artifacts/ai-tools-hub/src/components/ToolLandingPage.tsx` — reusable SEO landing page component
- `artifacts/ai-tools-hub/src/pages/ToolPage.tsx` — dynamic page wrapper using URL slug
- `artifacts/api-server/src/routes/mini-tools/index.ts` — server routes for uploaded tools with backend logic
- `artifacts/ai-tools-hub/public/tools/` — 19 uploaded static mini-app tools (tools 1-19)

## User Preferences

- Custom font: Zc-Regular.ttf site-wide, no external fonts
- No hexagon logo in sidebar
- Brand: "svivva-tools" / "by svivva"
- SEO goal: engineering-as-marketing to drive traffic to svivva.com
- Tools 20-50 still to be uploaded by user
