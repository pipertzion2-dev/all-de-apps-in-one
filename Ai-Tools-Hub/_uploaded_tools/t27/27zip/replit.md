# Free Chord Progression Generator (Svivva Play)

## Overview
A single-page static web app that generates musical chord progressions from a user's brief (description, mode, and genre). It previews one step of the Svivva Play pipeline without requiring a login. Optimized for Google Search as an engineering-as-marketing tool driving traffic to svivva.com.

## Tech Stack
- HTML5, CSS3, Vanilla JavaScript (no build step)
- Custom font: Zc-Regular.ttf + Google Fonts (DM Sans fallback)
- Static file serving via `npx serve`

## Project Structure
- `27/index.html` — Main entry point with full SEO optimization
- `27/app.js` — Chord generation logic, form handling, analytics
- `27/styles.css` — Three-panel layout, dark theme, responsive design
- `27/fonts/Zc-Regular.ttf` — Custom font

## SEO Features
- Title optimized for "chord progression generator" keyword
- Meta description, keywords, robots directive
- Canonical URL pointing to svivva.com/tools/chord-progression-generator
- Open Graph and Twitter Card meta tags
- JSON-LD structured data (WebApplication + FAQPage schemas)
- 400-600 word SEO body content with H2 subheadings
- 5-item FAQ with expandable details
- Internal linking to svivva.com, svivva.com/play, svivva.com/projects
- CTA blocks driving signups to Svivva

## Deployment
- Static site deployment from `27/` directory
- Dev server: `npx serve 27 -l 5000 --no-clipboard` on port 5000
