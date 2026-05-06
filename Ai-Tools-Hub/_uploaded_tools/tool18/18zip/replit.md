# AI BOM Generator (Free AI BOM Generator Online)

## Overview
A free, no-login SEO-optimized tool for the Svivva workflow ("engineering as marketing"). Users input project descriptions and get simulated previews (BOM tables, waveforms, flow diagrams, etc.) for various modes: Hardware, Play, Idea, Team, Marketplace, and Build. All links point to svivva.com.

## Tech Stack
- **Backend:** Node.js (vanilla `http` module, no frameworks)
- **Frontend:** Vanilla JavaScript (ES Modules), HTML5, CSS3
- **Fonts:** Custom `zc` font + Google Fonts (DM Sans)

## Project Structure
All source files live in the `18/` directory:
- `18/server.js` - HTTP server, static file serving, `/api/generate` endpoint
- `18/index.html` - Main page with SEO content, structured data, three-panel layout
- `18/app.js` - Frontend logic (form handling, API calls, rendering)
- `18/styles.css` - All styles including responsive layout
- `18/package.json` - Project metadata (`"type": "module"`)
- `18/robots.txt` - Search engine crawling instructions
- `18/sitemap.xml` - Sitemap for search engines

## Pages
- `/` → `index.html` — The interactive BOM generator tool
- `/landing` → `landing.html` — Full conversion-optimized marketing landing page
- `/robots.txt` — Crawl rules
- `/sitemap.xml` — Both pages listed

## Landing Page Structure (from Google Marketing Playbook)
- Dark hero with outcome-focused H1 + badge + dual CTAs above fold
- BOM mock preview in hero (right column)
- Problem strip (3 friction points engineers recognize)
- "How it works" (3 steps)
- 6 benefit cards (outcome-focused, not feature-focused)
- Upgrade block (free tool → full Svivva pipeline comparison)
- 400+ word SEO content section
- Accordion FAQ with JSON-LD FAQPage schema
- Final CTA section (dark bg matching hero)
- Footer with all Svivva module links

## SEO Features
- Title: "Free AI BOM Generator Online – Bill of Materials Tool | Svivva"
- H1 with primary keyword: "Free AI BOM Generator Online"
- 400-600 word long-form content section below the tool
- JSON-LD structured data (WebApplication + FAQPage schemas)
- Open Graph and Twitter Card meta tags
- Canonical URL pointing to svivva.com/tools/ai-bom-generator
- Internal linking to svivva.com modules (hardware, play, idea-engine, build, etc.)
- FAQ section with structured data markup
- robots.txt and sitemap.xml
- Header nav with links to Platform, Docs, Pricing on svivva.com
- Footer with full site links to svivva.com

## Running
- Workflow: `cd 18 && node server.js`
- Server listens on port 5000
- Deployment: autoscale with `node 18/server.js`
- API endpoint: `POST /api/generate` with JSON body `{description, mode, ...}`

## Key Notes
- The generate endpoint returns mock/simulated data (not real AI)
- Client-side fallback exists in `app.js` if the server is unavailable
- Six modes supported: hardware, play, idea, team, marketplace, build
- All external links point to svivva.com (not vivva)
