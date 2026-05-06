# Hardware Compliance Checker

## Overview
A free online hardware compliance checker that scans product briefs for regulatory risks across safety, EMC, RoHS, CE, and FCC. Built as an engineering-as-marketing tool to drive traffic to svivva.com.

## Tech Stack
- React 18.2.0 with TypeScript 5.3.0
- Vite 5.0.0 (dev server on port 5000)
- Plain CSS styling with custom "Zc Regular" font
- Static deployment (no backend)

## Project Structure
All source code lives in the `26/` directory:
- `26/src/App.tsx` - Main app component and state management
- `26/src/LeftPanel.tsx` - Input form panel
- `26/src/CenterPanel.tsx` - Scan results preview panel
- `26/src/RightPanel.tsx` - Workflow context panel with Svivva links
- `26/src/SEOBlock.tsx` - SEO content block (400-600 words, FAQ, CTAs, internal links)
- `26/src/CtaBar.tsx` - Sticky CTA bar linking to svivva.com
- `26/src/preview.ts` - Simulated scan result generation logic
- `26/src/types.ts` - TypeScript interfaces
- `26/src/App.css` / `26/src/index.css` - Styling
- `26/public/fonts/Zc-Regular.ttf` - Custom font
- `26/index.html` - Full SEO meta tags, Open Graph, structured data (JSON-LD)

## SEO Features
- H1 with target keyword: "Hardware Compliance Checker"
- Meta description optimized for click-through
- Open Graph and Twitter Card meta tags
- JSON-LD structured data (WebApplication + FAQPage schemas)
- 400-600 word SEO content block with internal links to svivva.com
- FAQ section with schema markup
- CTA blocks linking to svivva.com throughout
- Internal cross-linking to svivva.com/hardware, /build, /idea, /play, /team, /marketplace

## Running
- Dev: `cd 26 && npm run dev` (port 5000)
- Build: `cd 26 && npm run build` (outputs to 26/dist)
- Deployment: Static site, publicDir = 26/dist
