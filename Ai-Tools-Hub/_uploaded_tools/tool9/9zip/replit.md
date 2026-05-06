# JSON Repair Tool

A lightweight, client-side tool that fixes common malformed JSON issues instantly. Built as an engineering-as-marketing asset for Svivva.

## Overview

Users paste broken JSON (trailing commas, unquoted keys, single quotes, comments) and get repaired, valid JSON output along with a list of fixes applied. Optimized for Google Search with SEO content, structured data, and CTAs linking to svivva.com.

## Tech Stack

- Vanilla HTML/CSS/JavaScript (no build step, no frameworks)
- Custom ZC Regular font (self-hosted TTF)
- Served with `npx serve`

## File Structure

- `9/index.html` — Main page with SEO meta tags, Open Graph, structured data (JSON-LD), and 400-600 word content section
- `9/styles.css` — Styling (Flexbox, CSS variables, SEO content section, header nav)
- `9/repair.js` — Core repair logic (comment stripping, quote fixing, key quoting, trailing comma removal)
- `9/app.js` — UI interactions, event listeners, DOM updates
- `9/Zc-Regular.ttf` — Custom font file

## SEO

- Title: "JSON Repair Tool — Fix Broken JSON Online Free | Svivva"
- H1 contains primary keyword "JSON Repair Tool"
- Canonical URL: https://svivva.com/tools/json-repair
- Schema.org WebApplication structured data
- Open Graph and Twitter Card meta tags
- 400-600 word SEO content section with internal links to svivva.com
- Multiple CTAs: header nav, content links, sticky footer bar

## Deployment

- Target: static
- Public directory: `9/`
- Dev: `npx serve 9 -l 5000 --no-clipboard` on port 5000
