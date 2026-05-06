# Manufacturing Readiness Checker + Landing Pages

## Overview
Free online lead generation tools by Svivva ("engineering as marketing"). The main tool + a dedicated landing page per keyword cluster. The funnel: Google search → landing page → free tool → Svivva signup.

## Tech Stack
- Vanilla HTML5, CSS3, JavaScript (ES6+)
- Static site deployed from `22/` directory
- Custom font: Zc-Regular.ttf
- Analytics: Google Tag Manager + Segment (all CTA clicks and page views tracked per page)

## Pages

### 1. index.html — Manufacturing Readiness Checker (tool + SEO hub)
- Target keyword: "manufacturing readiness checker", "MRL assessment tool"
- Has the embedded tool (form → preview → readiness score)
- Hero section, use-case cards, outcomes section, 600-word SEO article
- Links internally to hardware-readiness-assessment.html

### 2. hardware-readiness-assessment.html — Dedicated Landing Page
- Target keyword: "hardware readiness assessment", "hardware readiness level calculator"
- Pure conversion page (no tool embedded) — playbook-correct structure
- Nav → Hero (CTA above fold) → Problem → How it works → What you get → Free tool band → Svivva upgrade → FAQ → SEO article → Bottom CTA → Footer
- Links back to index.html (the free tool) and to svivva.com

## File Structure
```
22/
├── index.html                          # Main tool + SEO hub
├── hardware-readiness-assessment.html  # Dedicated landing page
├── app.js                              # Tool logic + analytics
├── styles.css                          # Shared styles for index.html
└── fonts/
    └── Zc-Regular.ttf
```

## Deployment
- Type: Static site
- Public directory: `22/`
- Dev server: `python3 -m http.server 5000 --directory 22`

## Funnel Architecture
Google search → hardware-readiness-assessment.html → index.html (tool) → svivva.com

## SEO per page
### index.html
- Title: "Manufacturing Readiness Checker — Free Online MRL Assessment Tool | Svivva"
- JSON-LD: WebApplication + FAQPage (6 entries)
- 600-word SEO article, 6 use-case keyword cards, 30+ links to svivva.com

### hardware-readiness-assessment.html
- Title: "Hardware Readiness Assessment Tool — Free Online MRL Checker | Svivva"
- Canonical: svivva.com/tools/hardware-readiness-assessment
- JSON-LD: WebPage + FAQPage (5 entries)
- 5-section SEO article (400+ words)
- All CTAs tracked with page and location labels

## Analytics Events Tracked
- page_view (with keyword label per page)
- CTA click (with location label: hero_primary, hero_svivva_link, nav_bar, band_primary, upgrade_section, bottom_tool, bottom_svivva, etc.)
- module_interest (on tool form submit)
- preview_generated (after tool run)
