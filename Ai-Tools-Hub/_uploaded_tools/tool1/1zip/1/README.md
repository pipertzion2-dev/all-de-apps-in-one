# Mini App #11: Prompt Coverage Visualizer

Free, single-purpose web tool for **prompt coverage** — see how well your prompt references your schema or API. Targets long-tail keywords like “prompt coverage visualizer tool”, “prompt coverage visualizer online”, “prompt coverage visualizer free”.

## Features

- **No login** — use immediately, fast load
- **Three-panel layout** — input (left), results/charts (center), guidance (right)
- **Input:** prompt text, JSON schema or API definition, model selector
- **Output:** coverage score, bar chart, and table (which schema paths are covered)
- **Sticky CTA** — single primary CTA to Svivva (production-ready API, tests, versioning, monitoring)

## Run locally

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). Analysis runs in the browser (and optionally via `/api/analyze`); no login, runtime under 3 seconds.

## Font

The UI uses **zc regular** for all headings, labels, buttons, and helper text. The stylesheet uses a local `zc regular` font with fallbacks (DM Sans, system-ui). To use your own “zc regular” webfont, add a `url(...)` in `public/css/style.css` inside the `@font-face` rule.

## Svivva connection

The tool is positioned as a lightweight preview of Svivva’s production features: schema enforcement, evaluation generation, prompt optimization, versioning, monitoring, and cost control. The bottom CTA: *“You just tested one prompt. In Svivva you can turn this into a production-ready API with automated tests, versioning, monitoring, and cost optimization. Try Svivva for free.”*

## Structure

- `public/index.html` — three-panel page and CTA bar
- `public/css/style.css` — zc font, layout, #2563EB accent
- `public/js/app.js` — client-side coverage analysis (schema key extraction + prompt coverage)
- `server.js` — Express static server + optional `POST /api/analyze` (same logic, &lt;3s)
