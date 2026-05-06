# Mini App #22: Prompt Confidence Heatmap

Free, single-purpose web tool for **prompt confidence heatmap** analysis. Target keywords: *prompt confidence heatmap tool*, *prompt confidence heatmap online*, *prompt confidence heatmap free*.

## What it does

- **Input:** Paste a prompt, schema, or API definition; optional model/endpoint type.
- **Output:** Instant confidence scores across five dimensions (Clarity, Specificity, Structure, Safety & guardrails, Output shape) with a heatmap and score table.
- **Guidance:** Right panel explains each dimension and how to improve low scores.

No login, fast load, results in under 3 seconds (client-side only).

## Run locally

Open `index.html` in a browser, or serve the folder with any static server:

```bash
npx serve .
# or: python3 -m http.server 8000
```

Then open the URL shown (e.g. http://localhost:3000).

## Tech

- **Layout:** Three-panel (input | heatmap/results | guidance), sticky bottom CTA.
- **Font:** `zc` (fallback: DM Sans). Add your zc webfont in `styles.css` if needed.
- **Accent:** `#7C3AED`.
- **CTA:** Links to Svivva — production-ready APIs with tests, versioning, monitoring, cost optimization.

## Svivva

This tool is a lightweight preview of Svivva’s production features: schema enforcement, evaluation generation, prompt optimization, versioning, monitoring, and cost control.
