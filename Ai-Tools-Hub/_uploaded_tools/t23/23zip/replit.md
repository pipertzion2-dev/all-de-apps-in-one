# Hardware Documentation Exporter

## Overview
A free, client-side web tool by Svivva that generates production-style hardware documentation previews. Users describe a hardware concept and get a schematic preview, BOM table, flow graph, or idea report.

## Tech Stack
- Vanilla HTML5, CSS3, JavaScript (ES6+)
- Static file server: `server.js` (Node.js, no dependencies) for development
- Deployed as static site (publicDir: `23/`)
- Custom font: `Zc-Regular.ttf`

## Project Structure
```
server.js           - Static file server (port 5000, dev only)
23/
  index.html        - Main page (three-panel layout, full SEO markup)
  app.js            - Client-side logic (form handling, preview generation, analytics)
  styles.css        - Dark theme styling with CSS Grid layout
  robots.txt        - Search engine crawling directives
  sitemap.xml       - Sitemap for search indexing
  fonts/
    Zc-Regular.ttf  - Custom typeface
```

## Running
- Dev: `node server.js` on port 5000 via "Start application" workflow
- Production: Static deployment from `23/` directory

## SEO
- Canonical URL: `https://svivva.com/tools/hardware-documentation-exporter`
- JSON-LD structured data: WebApplication + FAQPage schemas
- Open Graph and Twitter Card meta tags
- 400-600 word SEO content section below main app
- Internal linking throughout to svivva.com
- robots.txt and sitemap.xml included

## Modes
Hardware, Play, Idea, Team, Marketplace, Build — each generates a different type of documentation preview.
