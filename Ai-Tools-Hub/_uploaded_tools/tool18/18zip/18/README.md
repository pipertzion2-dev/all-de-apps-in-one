# Free AI BOM Generator Online

Free, no-login preview of one step of the Svivva workflow. Built as an engineering-as-marketing tool to drive search traffic to svivva.com.

## Run locally

```bash
node server.js
```

Open [http://localhost:5000](http://localhost:5000). No account required.

## Structure

- **Left panel** — Structured inputs: short description (required), mode (hardware / play / idea / team / marketplace / build), optional constraints.
- **Center panel** — Generated preview (BOM table, waveform, flow, idea report, or setup map), readiness indicator, explanation, and primary/secondary CTAs.
- **Right panel** — Feature mapping with internal links to Svivva modules; which pipeline step is previewed and what the full workflow includes.
- **Sticky bottom bar** — Single primary CTA to svivva.com.

## SEO

- Title: "Free AI BOM Generator Online – Bill of Materials Tool | Svivva"
- H1: "Free AI BOM Generator Online"
- 400-600 word long-form content section
- JSON-LD structured data (WebApplication + FAQPage)
- Open Graph and Twitter Card meta tags
- Canonical URL: svivva.com/tools/ai-bom-generator
- Internal linking to svivva.com modules throughout
- robots.txt and sitemap.xml
- Header nav and footer with links to svivva.com

## Customization

- **Font:** Global font is **zc regular**. Place `zc-regular.woff2` in `fonts/` or set `--font-primary` in `styles.css`. Fallback is DM Sans.
- **Backend:** Replace the `generatePreview()` implementation in `server.js` with your real pipeline step; keep the response shape for compatibility.
- **Analytics:** Implement `track(event, data)` in `app.js` (e.g. gtag or your analytics lib). Events: `preview_generated`, `cta_click`, `module_interest`.

Target end-to-end runtime: under 3 seconds (mock response is immediate; swap adapter for real pipeline).
