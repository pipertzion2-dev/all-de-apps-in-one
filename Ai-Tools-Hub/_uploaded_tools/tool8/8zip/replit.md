# AI Model Comparison Tool

A free SEO-optimized web tool that compares AI models (GPT-4o, Claude, Gemini) side by side — estimating token usage, costs, and schema compatibility. Built as an engineering-as-marketing tool to drive organic traffic to svivva.com.

## Tech Stack

- **Backend:** Node.js + Express (ES modules)
- **Frontend:** Vanilla HTML/CSS/JS
- **Font:** Custom Zc Regular (local .ttf)
- **Dependencies:** express, cors

## Project Structure

- `8/server.js` — Express server with comparison logic and `/api/analyze` endpoint (port 5000)
- `8/public/index.html` — SEO-optimized page with structured data, Open Graph, 500+ word content section
- `8/public/app.js` — Frontend logic for user interaction and API calls
- `8/public/styles.css` — Styling with custom Zc Regular font
- `8/public/Zc-Regular.ttf` — Custom font file
- `8/package.json` — Project dependencies

## SEO

- Title/H1 targets "AI Model Comparison Tool" keyword
- Meta description, Open Graph, Twitter Card tags
- JSON-LD structured data (WebApplication schema)
- Canonical URL points to svivva.com/tools/ai-model-comparison
- 500+ word SEO content section below the tool
- Multiple internal links to svivva.com throughout

## Running

The app runs via the "Start application" workflow: `cd 8 && node server.js` on port 5000.

## Deployment

Configured for autoscale deployment: `node 8/server.js`

## API

- `POST /api/analyze` — Accepts `{ prompt, schema, apiConfig, selectedModels }` and returns token estimates, cost, and compatibility scores for each model.
