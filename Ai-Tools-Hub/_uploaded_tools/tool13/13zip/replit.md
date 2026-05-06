# AI Output Diff Visualizer

## Overview
A lightweight web tool for comparing and visualizing differences between AI model outputs (e.g., GPT-4 vs GPT-3.5, or different prompt versions). Features a three-panel interface with input, diff visualization, and guidance.

## Architecture
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6) — no build step needed
- **Backend**: Node.js server (`13/server.js`) using built-in `http` module, serves static files and provides a POST `/diff` API endpoint
- **Diff Engine**: Custom LCS-based diffing algorithms in `13/diff.js` (client-side) and `13/server.js` (server-side)

## Key Files
- `13/index.html` — Main HTML structure
- `13/app.js` — DOM interactions, event listeners, UI updates
- `13/diff.js` — Client-side diffing engine (line, word, similarity)
- `13/server.js` — Node.js server serving static files + POST /diff API
- `13/styles.css` — Styling with dark theme, three-panel layout
- `13/fonts/Zc-Regular.ttf` — Custom font

## Running
- **Command**: `node 13/server.js`
- **Port**: 5000
- Server serves all static files from the `13/` directory and handles POST `/diff` for server-side diffing

## Features
- Three diff modes: Unified, Side-by-side, Word-level
- Real-time diff as you type
- Similarity scoring, addition/deletion counts, execution time
- Responsive layout for mobile/tablet
