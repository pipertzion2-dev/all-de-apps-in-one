# Free AI Sound Generator Online

A React + TypeScript web application that simulates a sound generation workflow. Users enter a description and select a mode to generate a deterministic waveform preview. Serves as a demo/lead-generation tool for Svivva (svivva.com).

## Tech Stack
- React 18 with TypeScript
- Vite 5 (dev server on port 5000)
- CSS styling (no CSS framework)
- Deployed as a static site (build output: `32/dist`)

## SEO / Engineering as Marketing
- Target keyword: "Free AI Sound Generator Online"
- H1 contains primary keyword
- Meta description, Open Graph, and Twitter Card tags in index.html
- JSON-LD structured data (WebApplication + FAQPage schemas)
- Canonical URL set to svivva.com/tools/ai-sound-generator
- 400-600 word SEO content block with FAQ
- Internal links to all Svivva modules (svivva.com/*)
- Multiple CTAs funneling to svivva.com

## Project Structure
All source code lives in `32/`:
- `32/src/App.tsx` — main component with state management
- `32/src/LeftPanel.tsx` — input form (description, mode, constraints)
- `32/src/CenterPanel.tsx` — waveform preview display
- `32/src/RightPanel.tsx` — Svivva workflow info
- `32/src/CtaBar.tsx` — call-to-action footer
- `32/src/SEOBlock.tsx` — SEO content block (400-600 words), FAQ, internal links, CTAs
- `32/src/preview.ts` — deterministic waveform generation logic
- `32/src/types.ts` — TypeScript type definitions

## Running
```bash
cd 32 && npm run dev
```
Runs on port 5000.

## Deployment
Static site deployment. Build command: `cd 32 && npm run build`. Public directory: `32/dist`.
