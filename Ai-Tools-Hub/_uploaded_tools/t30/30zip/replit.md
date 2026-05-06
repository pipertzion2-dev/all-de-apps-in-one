# Composition Mode Preview Studio

## Overview
A static web-based demo tool for the Svivva platform (engineering as marketing). Users submit a brief (description + mode + optional constraints) and get a simulated production-style preview artifact (schematic, BOM, audio clip, flow graph, idea report, or setup map). Optimized for Google Search with structured data, Open Graph tags, FAQ schema, and 500+ words of SEO content.

## Tech Stack
- Vanilla HTML5, CSS3, JavaScript (ES6)
- Custom font: `Zc-Regular.ttf`
- No backend — all generation is client-side simulation
- Deployed as static site from `30/` directory

## Project Structure
```
30/
├── index.html       # Main entry point (SEO-optimized with JSON-LD structured data)
├── app.js           # Application logic (form handling, artifact rendering, analytics tracking)
├── styles.css       # Styling with CSS variables, three-panel grid layout, responsive design
├── favicon.ico      # Favicon
├── robots.txt       # Search engine crawling instructions
├── sitemap.xml      # XML sitemap for search engines
└── fonts/
    └── Zc-Regular.ttf  # Custom branding font
```

## Running
```
python3 -m http.server 5000 -d 30
```

## Deployment
- Target: Static site
- Public directory: `30/`

## SEO Features
- Title tag with primary keyword
- Meta description (under 160 chars)
- Canonical URL pointing to svivva.com
- Open Graph and Twitter Card meta tags
- JSON-LD structured data (WebApplication + FAQPage schemas)
- 504-word SEO content section
- Internal linking throughout to svivva.com
- robots.txt and sitemap.xml
- 5 FAQ items with schema markup

## Modes
- Hardware → schematic artifact
- Play → audio clip placeholder
- Idea → idea report
- Team → setup map
- Marketplace → flow graph
- Build → BOM table
