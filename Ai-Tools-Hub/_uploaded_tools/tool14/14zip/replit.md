# Prompt Compression Tool

## Overview
A client-side web application that analyzes and compresses AI prompts. It estimates token usage, identifies redundant phrasing, and provides a compressed version of the input text to help reduce API costs and latency.

## Tech Stack
- HTML5, CSS3, vanilla JavaScript (ES6)
- No external dependencies or frameworks
- Custom font: Zc-Regular (loaded locally)

## Project Structure
```
14/
├── index.html      # Main entry point
├── app.js          # Application logic (analysis, compression, DOM)
├── styles.css      # Dark-themed responsive UI styles
└── fonts/
    └── Zc-Regular.ttf
```

## Running
Served as a static site using Python's built-in HTTP server on port 5000:
```
python3 -m http.server 5000 --directory 14
```

## Features
- Token estimation (~4 chars/token)
- Redundancy detection (repeated phrases, filler words, verbose intros)
- Automated prompt compression
- Copy compressed output to clipboard
- Three-panel responsive layout (Input, Results, Guidance)
- All processing runs client-side in the browser
