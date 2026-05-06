# Prompt Drift Detector (Mini App #16)

A lightweight, browser-based tool that analyzes LLM prompts and schemas for "drift risk" — the potential for inconsistent model outputs over time. Built by Svivva as an engineering-as-marketing tool.

## How to Run

The app is served as a static site from the `6/` directory using Python's built-in HTTP server on port 5000.

**Workflow command:** `python3 -m http.server 5000 --directory 6`

## Deployment

Configured as a static site deployment with `publicDir: "6"`.

## Tech Stack

- Pure static web app (HTML5, CSS3, vanilla JavaScript)
- Custom font: Zc-Regular (`6/Zc-Regular.ttf`)
- No external dependencies or backend
- All analysis runs locally in the browser

## SEO / Engineering as Marketing

- Full SEO meta tags (title, description, keywords, Open Graph, Twitter Card)
- Schema.org JSON-LD structured data (WebApplication type)
- Canonical URL: `https://svivva.com/tools/prompt-drift-detector`
- H1 with target keyword: "Prompt Drift Detector"
- 525-word SEO content article below the tool
- Internal links and CTAs pointing to `svivva.com`
- Footer with links to Svivva and tools page

## Project Structure

- `6/index.html` — Main application file (SEO-optimized)
- `6/Zc-Regular.ttf` — Custom font file
- `6/prompt-drift-detector.html` — Legacy alternate version (not SEO-optimized)
- `6/netlify.toml` — Netlify deployment config
- `6/deploy.zip` — Pre-packaged deployment archive
