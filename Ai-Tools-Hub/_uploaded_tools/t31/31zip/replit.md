# Ensemble Layering Playground

## Overview
A free, static single-page web tool that previews one step of the Svivva platform's ensemble layering workflow. Users submit a short brief and receive a production-style preview (schematic, BOM, flow graph, idea report, or setup map). Designed as an engineering-as-marketing tool to drive organic search traffic to svivva.com.

## Tech Stack
- Vanilla JavaScript (ES6), HTML5, CSS3
- Custom font: `Zc-Regular.ttf`
- Static file serving via `serve` package on port 5000
- Deployed as a static site from the `31/` directory

## Project Structure
- `31/index.html` — Main entry point (SEO-optimized with meta tags, Open Graph, Twitter Cards, JSON-LD structured data)
- `31/app.js` — Core logic (mode templates, preview generation, rendering)
- `31/styles.css` — Styling with CSS variables, three-panel grid layout
- `31/fonts/` — Custom font files
- `31/robots.txt` — Search engine crawler directives
- `31/sitemap.xml` — XML sitemap for search engines

## SEO Features
- Title tag with primary keyword
- Meta description, keywords, author, robots
- Open Graph and Twitter Card meta tags
- JSON-LD structured data (WebApplication + FAQPage schemas)
- Canonical URL pointing to svivva.com
- 500+ words of indexable content
- Internal linking throughout to svivva.com modules
- FAQ section with 5 questions (schema markup)
- Multiple CTAs funneling to svivva.com

## Running
```
npx serve 31 -l 5000 --no-clipboard
```

## Deployment
Configured as static deployment with `publicDir: "31"`.
