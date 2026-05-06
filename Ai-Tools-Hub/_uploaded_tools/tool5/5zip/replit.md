# AI Test Case Generator

## Overview
A free online tool that analyzes AI prompts, JSON schemas, and API definitions to generate test case suggestions and score their testability. Built as an engineering-as-marketing tool for Svivva (svivva.com). No login required, results in under 3 seconds.

## Tech Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Node.js (native `http` module, no frameworks)
- **Font**: Custom ZcRegularSite font embedded via base64 in `font-embed.css`

## Project Structure
All source files are in the `5/` directory:
- `5/server.js` — Backend entry point, serves static files and POST `/analyze` endpoint (port 5000)
- `5/index.html` — Main HTML page with SEO optimization, structured data, and three-panel layout
- `5/app.js` — Frontend logic: client-side analysis engine and UI rendering
- `5/styles.css` — Application styling (includes SEO content section, brand header, footer)
- `5/font-embed.css` — Base64-embedded custom font
- `5/robots.txt` — Search engine crawling directives
- `5/package.json` — Project metadata

## Running
- Workflow: `node 5/server.js` on port 5000
- Deployment: autoscale target via `node 5/server.js`

## SEO / Engineering as Marketing
- Target keyword: "AI Test Case Generator"
- H1 contains primary keyword
- Meta description, OG tags, Twitter cards configured
- JSON-LD structured data: WebApplication + FAQPage schemas
- ~500-word SEO content section below the tool
- Canonical URL: https://svivva.com/tools/ai-test-case-generator
- Internal links to svivva.com throughout (header brand, guidance, CTA bar, footer)
- robots.txt with sitemap reference

## Key Features
- Three input modes: Prompt, JSON Schema, API definition
- Testability scoring (0-100)
- Dynamic test case suggestion table
- Responsive three-panel layout
- Multiple CTAs driving traffic to svivva.com
