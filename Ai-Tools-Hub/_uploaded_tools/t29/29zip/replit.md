# AI Melody Interpolator (Svivva Preview Tool)

## Overview
A static web application that provides a single-step preview of the Svivva workflow. Users submit a brief (description and constraints) and receive a simulated production-style preview artifact. Built as an "engineering as marketing" tool to drive Google search traffic to svivva.com.

## Tech Stack
- Vanilla HTML5, CSS3, JavaScript (ES6)
- Custom font: "zc regular" (`29/fonts/Zc-Regular.ttf`)
- Static file server: `serve` (npm)

## Project Structure
- `29/index.html` - Main entry point (SEO-optimized with structured data, Open Graph, FAQ schema)
- `29/app.js` - Application logic (form handling, simulated preview generation)
- `29/styles.css` - Styling (three-panel grid layout, responsive, SEO content section)
- `29/fonts/Zc-Regular.ttf` - Custom font
- `29/robots.txt` - Search engine crawl directives
- `29/sitemap.xml` - XML sitemap for search engines

## SEO Elements
- Canonical URL pointing to svivva.com/tools/melody-interpolator
- Schema.org structured data (WebApplication + FAQPage)
- Open Graph and Twitter Card meta tags
- 400-600 word SEO content section with keyword-rich headings
- Internal links throughout pointing to svivva.com
- robots.txt and sitemap.xml

## Deployment
- Static site deployment from `29/` directory
- Served via `npx serve 29 -l 5000` on port 5000 in development

## Modes
- Play (audio/melody), Hardware (schematic), Idea (report), Team (setup map), Marketplace (flow graph), Build (BOM)
