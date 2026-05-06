# AI Prompt Linter

## Overview
A free, single-purpose web tool for analyzing, scoring, and improving LLM prompts, JSON schemas, and API definitions. Provides instant feedback on prompt clarity, structure, safety (injection risks), and validity. Built as an engineering-as-marketing tool to drive search traffic to svivva.com.

## Tech Stack
- **Frontend:** Vanilla JavaScript, HTML5, CSS3 (three-panel layout)
- **Backend:** Node.js using native `http` module (no frameworks)
- **Port:** 5000

## Project Structure
All source code lives in the `3/` directory:
- `3/index.html` - Main UI with SEO content, structured data, Open Graph tags
- `3/app.js` - Client-side linting logic and DOM manipulation
- `3/styles.css` - Styling for three-panel layout + SEO content section
- `3/server.js` - Node.js server (static files + `/api/lint` POST endpoint)
- `3/package.json` - Project metadata

## SEO
- Target keywords: "ai prompt linter", "llm prompt linter", "prompt linter tool"
- 400-600 word SEO content section below the tool
- JSON-LD structured data (WebApplication schema)
- Open Graph and Twitter Card meta tags
- Internal linking to svivva.com (5 links total)
- CTAs: sticky footer bar + header link + guidance panel + SEO content

## Running
The workflow runs `cd 3 && node server.js` which starts the server on port 5000.

## Deployment
- Target: autoscale
- Run command: `node 3/server.js`

## API
- `POST /api/lint` - Accepts `{text, type, model}` JSON body, returns linting results with overall score and individual checks.
