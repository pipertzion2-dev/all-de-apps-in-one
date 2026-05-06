# Prompt Consistency Scorer

Free, single-purpose web tool for **prompt consistency scoring**. Upload a prompt, optional schema or API definition, and get instant analysis and scoring.

**Target keywords:** prompt consistency scorer tool, prompt consistency scorer online, prompt consistency scorer free.

## Run locally

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). No login required.

## Stack

- **Frontend:** HTML, CSS, JS (zc regular font, three-panel layout, accent `#B45309`)
- **Backend:** Express; single `POST /api/analyze` endpoint. Swap the analysis logic in `server.js` to reuse this template for other mini-apps. Runtime target: under 3 seconds.

## CTA

Sticky bottom bar links to Svivva: production-ready APIs with automated tests, versioning, monitoring, and cost optimization.
