# API Latency Calculator

## Overview
A free SEO-optimized web tool that estimates and analyzes API latency for LLM prompts and schemas. Branded as a Svivva engineering-as-marketing tool. Users input a prompt, schema, or API definition and receive a breakdown of estimated latency components (Network RTT, Serialization, Model Inference) along with scoring and optimization tips.

## Tech Stack
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Backend**: Node.js using built-in `http` module (no frameworks)
- **Font**: Custom "zc" font (zc-regular.ttf)
- **Data Format**: JSON for frontend-backend communication

## Project Structure
```
4/
├── server.js           # Node.js server with latency analysis logic
├── package.json        # Project metadata and scripts
├── README.md           # Project documentation
└── public/
    ├── index.html      # Main UI with full SEO (structured data, OG tags, FAQ schema)
    ├── app.js           # Frontend interaction and API calls
    ├── styles.css       # Styling with amber accent (#B45309)
    ├── zc-regular.ttf   # Custom font file
    ├── robots.txt       # Search engine crawling rules
    └── sitemap.xml      # XML sitemap for search indexing
```

## Running
- Server binds to `0.0.0.0:5000`
- Workflow: `node 4/server.js`
- Deployment: autoscale target with `node 4/server.js`
- API endpoint: `POST /api/analyze` accepts `{ prompt, schema, model, apiConfig }`
- Frontend includes client-side fallback analysis logic (works without server)

## SEO Features
- Keyword-optimized title and H1: "API Latency Calculator"
- 400-600 word SEO content article below the tool
- Structured data: WebApplication schema + FAQPage schema
- Open Graph and Twitter Card meta tags
- Canonical URL pointing to svivva.com/tools/api-latency-calculator
- robots.txt and sitemap.xml
- Internal linking throughout to svivva.com
- Multiple CTAs driving traffic to Svivva

## Key Details
- No external dependencies
- Analysis is deterministic/simulated (not calling real LLM APIs)
- Three-panel layout: Input | Results | Guidance
- All links point to svivva.com (not vivva)
