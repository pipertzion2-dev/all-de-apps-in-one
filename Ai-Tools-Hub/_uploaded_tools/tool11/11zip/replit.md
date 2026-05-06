# Synthetic Dataset Generator

## Overview
A free online tool that generates synthetic datasets from JSON schemas, API specs, or natural language prompts. Provides instant analysis, scoring, and sample data generation. No login required.

## Tech Stack
- **Backend**: Node.js + Express
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Port**: 5000

## Project Structure
All source files live in the `11/` directory:
- `11/server.js` — Express server with `POST /api/analyze` endpoint
- `11/index.html` — Main UI with three-panel layout (Input, Results, Guidance)
- `11/app.js` — Client-side logic, tab switching, result rendering, and client-side fallback analysis
- `11/styles.css` — Styling
- `11/fonts/` — Custom font files

## Running
The workflow runs `cd 11 && npm start`, which starts the Express server on port 5000.

## API
- `POST /api/analyze` — Accepts `{ type, raw, model, rowCount }` and returns `{ scores, fields, columns, sampleRows, interpretation }`
