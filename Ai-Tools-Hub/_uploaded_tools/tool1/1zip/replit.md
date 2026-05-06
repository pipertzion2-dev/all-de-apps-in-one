# Prompt Coverage Checker

## Overview
A free, single-purpose web tool that analyzes how well an LLM prompt references or covers a JSON schema or API definition. Helps users identify gaps in their prompts. Built as an engineering-as-marketing tool to drive traffic to svivva.com.

## Tech Stack
- **Backend**: Node.js (v20) with Express.js
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **No database** — all analysis runs client-side or via a simple server endpoint

## Project Structure
- `1/server.js` — Express server (entry point), serves static files and provides `/api/analyze` endpoint
- `1/public/index.html` — Frontend UI (three-panel layout + SEO content section)
- `1/public/js/app.js` — Client-side analysis logic
- `1/public/css/style.css` — Styling
- `1/public/favicon.svg` — Favicon

## SEO / Engineering as Marketing
- Title and H1 target "Prompt Coverage Checker" keyword
- 400-600 word SEO content section below the fold
- JSON-LD structured data (WebApplication + FAQPage)
- Open Graph and Twitter Card meta tags
- Canonical URL points to svivva.com/tools/prompt-coverage-checker
- Multiple internal links and CTAs to svivva.com
- OG/Twitter image references svivva.com/images/prompt-coverage-checker-og.png (needs to be hosted there)

## Running
- Workflow: `cd 1 && node server.js` on port 5000
- Deployment: autoscale with `node 1/server.js`

## Dependencies
- express ^4.21.0
