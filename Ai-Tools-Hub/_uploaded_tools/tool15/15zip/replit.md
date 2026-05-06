# Evaluation Rule Builder

A free, client-side web tool for building and validating evaluation rules for AI prompts, JSON schemas, and API definitions. Serves as a lead-generation tool for the Svivva platform.

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js (minimal static file server)
- **Fonts:** Google Fonts (Outfit)

## Project Structure

All source files live in the `15/` directory:

- `15/index.html` — Main UI with three-panel layout
- `15/app.js` — Client-side analysis logic (runAnalysis, scoring, rendering)
- `15/styles.css` — Styling with accent color #0F766E
- `15/server.js` — Minimal Node.js HTTP server serving static files on port 5000
- `15/package.json` — Project metadata

## Running

The app is served via the "Start application" workflow (`node 15/server.js`) on port 5000.

## Features

- Three input types: Prompt, JSON Schema, API definition
- Client-side analysis generating evaluation rules
- Coverage score, rule count, and consistency metrics
- Rule distribution bar chart
- Guidance panel with result interpretation
- Sticky CTA bar linking to Svivva
