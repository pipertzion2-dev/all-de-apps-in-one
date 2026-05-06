# AI BOM Generator Playground (Mini App #18)

Free, no-login preview of one step of the Svivva workflow. Target: hardware builders, music creators, product teams, and founders.

## Run locally

```bash
node server.js
```

Open [http://localhost:3000](http://localhost:3000). No account required.

## Structure

- **Left panel** — Structured inputs: short description (required), mode (hardware / play / idea / team / marketplace / build), optional constraints.
- **Center panel** — Generated preview (BOM table, waveform, flow, idea report, or setup map), readiness indicator, explanation, and primary/secondary CTAs.
- **Right panel** — Feature mapping and upgrade copy; which Svivva step is previewed and what the full workflow includes.
- **Sticky bottom bar** — Single primary CTA to Svivva.

## Customization

- **Font:** Global font is **zc regular**. Place `zc-regular.woff2` in `fonts/` or set `--font-primary` in `styles.css`. Fallback is DM Sans.
- **Backend:** Replace the `generatePreview()` implementation in `server.js` with your real pipeline step; keep the response shape for compatibility.
- **Analytics:** Implement `track(event, data)` in `app.js` (e.g. gtag or your analytics lib). Events: `preview_generated`, `cta_click`, `module_interest`.

## SEO

- H1: _AI BOM Generator Playground_
- Intro paragraph and tool in the three-panel layout
- FAQ block (3 questions)
- Internal link to main Svivva module page

Target end-to-end runtime: under 3 seconds (mock response is immediate; swap adapter for real pipeline).
