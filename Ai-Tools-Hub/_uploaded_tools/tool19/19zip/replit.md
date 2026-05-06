# Free BOM Generator & Material Sourcing Tool (Mini App #19)

Two-page Google-first marketing setup for Svivva. Targets high-intent keywords for engineering-as-marketing traffic.

## Pages
- **`19/landing.html`** — Bottom-of-funnel landing page targeting "bill of materials generator". CTA above the fold, conversion-optimized, links to the tool and to svivva.com.
- **`19/index.html`** — The actual free tool (BOM Generator). Three-panel app with full SEO.

## Tech Stack
- Vanilla HTML5, CSS3, JavaScript (ES6)
- Static site served with `npx serve`
- Custom font: Zc-Regular (local), Outfit (Google Fonts)

## Files
- `19/landing.html` - Dedicated conversion landing page (primary Google Search entry point)
- `19/landing.css` - Landing page styles (hero, steps, comparison table, FAQ, CTAs)
- `19/index.html` - BOM tool app with full SEO meta tags
- `19/app.js` - Client-side logic, form handling, mock preview generation
- `19/styles.css` - Three-panel layout, nav bar, SEO content section
- `19/fonts/Zc-Regular.ttf` - Custom font file

## SEO / Marketing Strategy (from PDF Playbook)
- Primary keyword: "bill of materials generator" (landing page)
- Secondary keyword: "material sourcing tool" / "BOM generator" (tool page)
- Both pages have: H1 with keyword, meta description, OG tags, Twitter cards, JSON-LD schema
- FAQPage structured data on both pages (Rich Results eligible)
- Internal linking: landing → tool, tool → landing, both → svivva.com
- CTA above the fold on landing page
- Comparison table: free tool vs full Svivva platform
- 400-600 word SEO content sections on both pages

## Running
Static site served from `19/` on port 5000.

## Deployment
- **Type**: Static
- **Public directory**: `19`

## Workflow
- **Start application**: `npx serve 19 -l 5000 --no-clipboard`
