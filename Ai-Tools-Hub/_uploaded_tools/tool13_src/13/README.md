# AI Output Diff Visualizer

Free, single-purpose web tool for comparing AI model outputs with real-time diff and scoring. Targets long-tail keywords like *ai output diff visualizer tool*, *ai output diff visualizer online*, *ai output diff visualizer free*.

## What it does

- **Left panel:** Prompt, Output A, Output B, optional schema, API config, and model selection.
- **Center panel:** Real-time unified / side-by-side / word-level diff, plus similarity and stats.
- **Right panel:** Guidance and interpretation of results.

## Run locally

- **Front-end only (no backend):** Open `index.html` in a browser or serve the folder with any static server (e.g. `npx serve .`). All diff logic runs in the browser; runtime is under 3 seconds (typically instant).
- **With optional backend:** `node server.js` then open the app; the page currently uses client-side diff by default. You can later point the app at `POST /diff` to use the server (same analysis, reusable template).

## Tech

- Vanilla HTML/CSS/JS.
- Global font: ZC Regular (with Outfit fallback). Accent: `#2563EB`.
- Sticky bottom CTA linking to Svivva (production-ready API, tests, versioning, monitoring, cost optimization).

## Svivva

This tool is a lightweight preview of Svivva’s production platform: schema enforcement, evaluation generation, prompt optimization, versioning, monitoring, and cost control. CTA: *"You just tested one prompt. In Svivva you can turn this into a production-ready API with automated tests, versioning, monitoring, and cost optimization. Try Svivva for free."*
