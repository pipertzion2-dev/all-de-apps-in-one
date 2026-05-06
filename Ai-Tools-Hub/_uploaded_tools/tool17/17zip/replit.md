# Svivva Hardware Tools — Engineering as Marketing

## Overview
Two-page engineering-as-marketing micro-site for Svivva. Drives organic Google search traffic and converts visitors into Svivva signups. Entirely client-side static site.

## Pages

### 1. Free Hardware Schematic Generator (`index.html`)
- **Target keyword**: "free hardware schematic generator online"
- Interactive tool: enter a hardware concept, get an SVG schematic + BOM preview instantly
- Drives traffic from engineers searching for free tools, funnels them to svivva.com

### 2. Hardware Design Software Landing Page (`landing.html`)
- **Target keyword**: "hardware design software" / "hardware development platform"
- Bottom-of-funnel conversion page targeting teams ready to adopt a full platform
- Outcome-focused copy (not feature-focused), CTA above the fold, full SEO structure
- Cross-links back to the schematic tool for lower-funnel visitors not ready to commit

## Tech Stack
- HTML5, CSS3, Vanilla JavaScript (ES6)
- No frameworks or build tools — static site, zero dependencies
- Custom font: zc-regular.ttf + JetBrains Mono (Google Fonts)

## SEO / Marketing (Both Pages)
- H1 with primary keyword
- Optimized title + meta description per page
- JSON-LD structured data (WebApplication/SoftwareApplication + FAQPage schemas)
- Open Graph and Twitter Card tags
- Canonical URLs pointing to svivva.com
- FAQ sections with schema markup (eligible for Google rich results)
- Internal cross-linking between pages and to svivva.com subpages
- All CTAs link to svivva.com (verified, no "vivva" references)
- SEO content sections 400–650 words
- Outcome-focused copy per Google Marketing Playbook

## File Structure
```
17/
  index.html      - Schematic generator tool + SEO content
  app.js          - Tool logic (BOM derivation, SVG rendering, analytics hooks)
  styles.css      - Tool page styles
  landing.html    - Hardware design software landing page
  landing.css     - Landing page styles
  zc-regular.ttf  - Custom brand font
  README.md       - Project documentation
```

## Deployment
- Type: Static site
- Public directory: `17/`
- Dev server: `python3 -m http.server 5000 --directory 17`
