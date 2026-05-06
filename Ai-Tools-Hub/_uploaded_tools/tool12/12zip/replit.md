# Prompt Confidence Heatmap

A client-side web tool that analyzes AI prompts across five dimensions (Clarity, Specificity, Structure, Safety & Guardrails, Output Shape) and displays a visual confidence heatmap.

## Tech Stack
- Vanilla HTML5, CSS3, JavaScript (ES6)
- Static site served with `npx serve`
- Custom font: `Zc-Regular.ttf`

## Project Structure
- `12/index.html` — Main HTML entry point
- `12/app.js` — Scoring logic, heatmap rendering, event handling
- `12/styles.css` — Three-panel layout, colors, typography
- `12/fonts/Zc-Regular.ttf` — Custom font asset

## Running
The workflow serves the `12/` directory on port 5000 using `npx serve`.
