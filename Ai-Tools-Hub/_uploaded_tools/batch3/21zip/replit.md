# Free Text to 3D Model Generator Online (Mini App #21)

A Google-first marketing tool for Svivva. Consists of a dedicated landing page + the actual free tool. All CTAs drive traffic to svivva.com.

## Tech Stack
- React 18 with TypeScript
- React Router v6 (HashRouter for static hosting)
- Vite 5 (dev server and build)
- Standard CSS
- Node.js 20

## Routes
- `/` (i.e. `/#/`) — Landing page (`LandingPage.tsx`)
- `/tool` (i.e. `/#/tool`) — The actual three-panel preview tool (`App.tsx`)

## SEO Features
- Keyword-optimized H1: "Free Text to 3D Model Generator Online"
- Meta description (155 chars) targeting "text to 3D model" queries
- Open Graph and Twitter Card meta tags
- JSON-LD structured data (WebApplication + FAQPage schemas)
- Canonical URL pointing to svivva.com/tools/text-to-3d
- 500-word SEO content block with keyword-rich headings (below tool)
- Internal cross-domain linking to svivva.com module pages
- Multiple CTAs driving to svivva.com

## Landing Page Sections (LandingPage.tsx)
1. Sticky nav — Svivva logo + "Try the free tool" + "Start on Svivva →"
2. Hero — H1, outcome subheadline, two CTAs, trust strip
3. Problem/Solution — "The old way vs With this tool"
4. How it works — 3 numbered steps
5. Outcomes — 5 benefit bullets
6. Mode cards — 6 clickable cards linking to svivva.com/[mode]
7. Final CTA section — drives to svivva.com or back to tool
8. Footer — links to all svivva.com module pages

## Project Structure (21/)
- `src/main.tsx` — Router setup (HashRouter)
- `src/LandingPage.tsx` — Marketing landing page
- `src/LandingPage.css` — Landing page styles
- `src/App.tsx` — Three-panel preview tool
- `src/App.css` — Tool styles
- `src/index.css` — Global styles and CSS variables
- `src/preview.ts` — Simulated preview generation logic
- `src/types.ts` — TypeScript types
- `src/LeftPanel.tsx` — Input form
- `src/CenterPanel.tsx` — Preview display
- `src/RightPanel.tsx` — Svivva workflow context
- `src/CtaBar.tsx` — Sticky footer CTA
- `src/SEOBlock.tsx` — SEO content block (below tool)
- `index.html` — HTML with meta tags, OG tags, JSON-LD schemas
- `vite.config.ts` — Vite config (port 5000, host 0.0.0.0)

## Running
Workflow: `cd 21 && npm run dev` on port 5000

## Deployment
Static site: builds to `21/dist` via `cd 21 && npm run build`
