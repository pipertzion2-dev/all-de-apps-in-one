# API Latency Forecaster (Mini App #14)

Free, single-purpose web tool for **api latency forecaster**–style estimates. Upload a prompt, schema, or API definition and get instant latency analysis, scoring, and visualization. No login required.

## Run locally

**Option A – no server (works offline):**  
Open `public/index.html` in your browser (double-click or File → Open). The tool runs the same analysis in the browser, so localhost is not required.

**Option B – with Node server:**  
```bash
npm start
```
Then open **http://127.0.0.1:3040** (or http://localhost:3040). If the server won’t start (e.g. port blocked), try another port: `PORT=8080 npm start` then open http://127.0.0.1:8080. If it still fails, use Option A and open the HTML file directly.

## Stack

- **Frontend:** HTML, CSS, JS (three-panel layout; accent `#B45309`; font: zc regular / DM Sans fallback).
- **Backend:** Node.js HTTP server; `POST /api/analyze` with `{ prompt, schema, model, apiConfig }` returns latency breakdown and tips.

## Svivva CTA

The sticky bottom bar links to Svivva and positions this tool as a lightweight preview of production features: schema enforcement, evaluation, prompt optimization, versioning, monitoring, and cost control.
