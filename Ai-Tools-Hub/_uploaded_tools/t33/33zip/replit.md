# Free MIDI Mapper & Audio Stem Export Tool — by Svivva

## Overview
A single-step simulation of Svivva's audio export and MIDI mapping pipeline. Serves as an engineering-as-marketing tool to drive organic Google search traffic to svivva.com. Allows music creators and hardware builders to preview how their audio description would be mapped to MIDI and exported as stems, without requiring an account.

## Tech Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Fonts**: Custom webfont `ZC Regular` (in `33/fonts/`) with `Outfit` fallback (Google Fonts)
- **Server**: `serve` (static file server) for dev; deployed as static site
- **Deployment**: Static deployment from `33/` directory

## Project Structure
```
33/
├── index.html      # Main entry point (SEO-optimized)
├── app.js          # Client-side simulation logic
├── styles.css      # Styling (dark theme, three-panel layout)
├── fonts/
│   └── Zc-Regular.ttf
└── README.md       # Project documentation
```

## Running
The workflow serves the `33/` directory on port 5000 using `npx serve 33 -l 5000`.

## SEO & Engineering as Marketing
- Title tag: "Free MIDI Mapper & Audio Stem Export Tool Online | Svivva"
- 400-600 word SEO content section below the tool
- H1 with primary keyword
- JSON-LD structured data (WebApplication + FAQPage schemas)
- Open Graph and Twitter Card meta tags
- Internal linking to svivva.com, svivva.com/modules, svivva.com/open
- Canonical URL pointing to svivva.com/tools/midi-mapper
- 5-item FAQ with structured data for rich snippets
- Multiple CTAs driving traffic to Svivva

## Key Features
- Client-side simulation (no backend required)
- Three-panel responsive layout
- Waveform visualization and MIDI mapping table generation
- Analytics stubs for `gtag` / Segment integration
