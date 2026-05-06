# Synthetic Dataset Generator — Free Online Tool

Single-purpose web tool for **synthetic dataset generator** workflows: upload a prompt, schema, or API definition and get instant analysis, scoring, and sample data. No login required.

**Target keywords:** synthetic dataset generator tool, synthetic dataset generator online, synthetic dataset generator free.

## Run locally

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Font (zc regular)

The UI is designed for **zc regular**. To use it:

1. Add `zc-regular.woff2` into the `fonts/` folder.
2. In `styles.css`, uncomment the `@font-face` block at the top.

Without the file, the site uses **DM Sans** as fallback so the layout stays correct.

## Tech

- **Frontend:** HTML, CSS, vanilla JS. Three-panel layout; accent `#1D4ED8`.
- **Backend:** Express; `POST /api/analyze` runs analysis (under 3s). Works offline via client-side fallback if the server is unavailable.

## Svivva

This tool is a lightweight preview of [Svivva](https://svivva.com) capabilities: schema enforcement, evaluation generation, prompt optimization, versioning, monitoring, and cost control. Production-ready APIs with automated tests and cost optimization → try Svivva for free.
