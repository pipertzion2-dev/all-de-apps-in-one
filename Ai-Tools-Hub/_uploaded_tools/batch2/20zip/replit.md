# Hardware Cost Estimator — Svivva

## Overview
Two-page engineering-as-marketing asset for Svivva. Both pages drive traffic from Google search and convert visitors to svivva.com.

## Page Architecture

### `landing.html` — Dedicated SEO landing page (the traffic driver)
Per the Google Marketing Playbook: one landing page per keyword, structured around solving search intent, primary CTA to Svivva above the fold, tool embedded inline so users get value without leaving the page.

**Conversion funnel:**
`Google search → landing.html → use embedded estimator → "Try Svivva free" → svivva.com signup`

**Structure:**
1. Sticky nav with "Try Svivva free →" CTA
2. Hero: H1 keyword + "Try Svivva free" (primary) + "Try the free estimator ↓" (secondary) — both above the fold
3. Embedded estimator tool (form + results inline, no page jump required)
4. Post-estimate upgrade block: "Try Svivva free" after results appear
5. Why engineers estimate hardware costs early (3-card section)
6. "One Step Free. Full Pipeline in Svivva." bridge section with feature list
7. 6-question FAQ with FAQPage schema
8. Final CTA: "Try Svivva free" primary
9. Footer with svivva.com links

**Analytics events tracked:** `lp_estimate_started`, `lp_estimate_generated`, `lp_cta_click` (location tagged per placement)

### `index.html` — The full estimator tool
Three-panel tool with SEO content section, FAQ, and CTAs to svivva.com. For users who want the full tool experience.

## Tech Stack
- HTML5, CSS3, Vanilla JS (no build step, zero dependencies)
- Custom font: `Zc-Regular.ttf`
- Static deployment from `20/` directory

## File Structure
```
20/
├── landing.html    # SEO landing page — primary traffic driver
├── landing.css     # Landing page styles
├── index.html      # Full estimator tool
├── app.js          # Tool logic
├── styles.css      # Tool styles
├── robots.txt
├── sitemap.xml
└── fonts/
    └── Zc-Regular.ttf
```

## SEO Configuration
- Primary keyword: "hardware cost estimator"
- Landing page canonical: https://svivva.com/hardware-cost-estimator
- Tool page canonical: https://svivva.com/tools/hardware-cost-estimator
- JSON-LD: WebApplication + FAQPage on both pages
- OG + Twitter Card on both pages
- 24 links to svivva.com on landing page

## Running & Deploying
- Dev server: `python3 -m http.server 5000 --directory 20`
- Landing page: `/landing.html`
- Tool: `/index.html`
- Deploy: Static site from `20/` — click Publish in Replit
