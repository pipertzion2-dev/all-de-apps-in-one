# JSON Schema Analyzer

## Overview
A free, single-purpose web tool for analyzing which JSON schema fields have the highest impact on prompts and API behavior. Optimized for SEO to drive engineering traffic to svivva.com.

## Tech Stack
- **Backend**: Node.js + Express (ESM modules)
- **Frontend**: Vanilla HTML/CSS/JavaScript with Canvas-based charts
- **No database** — all analysis is done in-memory

## Project Structure
All source code lives in the `2/` directory:
- `2/server/index.js` — Express server entry point (port 5000)
- `2/server/analyzer.js` — Schema analysis logic
- `2/public/index.html` — Main HTML page with SEO content section
- `2/public/styles.css` — Styles with custom font (Zc-Regular)
- `2/public/app.js` — Frontend JavaScript
- `2/public/robots.txt` — Search engine crawling rules
- `2/public/sitemap.xml` — XML sitemap for search engines
- `2/fonts/` — Custom font files

## Running
Workflow: `cd 2 && npm start` — serves the app on port 5000

## Deployment
- Target: autoscale
- Run command: `node 2/server/index.js`

## API
- `POST /api/analyze` — Accepts `{ schema, prompt, apiDefinition, modelPreference }`, returns field impact scores

## SEO
- Canonical URL points to svivva.com/tools/json-schema-analyzer
- 400-600 word content section below the tool for Google indexing
- JSON-LD structured data (WebApplication schema)
- Open Graph and Twitter Card meta tags
- Internal links to svivva.com throughout
- robots.txt and sitemap.xml included

## Dependencies
- express ^4.18.2
- cors ^2.8.5
