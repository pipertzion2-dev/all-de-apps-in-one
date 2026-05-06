# Prompt Security Scanner

A client-side web application that scans AI prompts, JSON schemas, and API definitions (OpenAPI) for security risks. All analysis runs in the browser — no data is sent to any server. Built as an engineering-as-marketing tool for Svivva.

## Tech Stack

- Vanilla JavaScript (ES6), HTML5, CSS3
- Custom Zc font (TTF)
- Static site served with `npx serve`
- Deployed as a static site (publicDir: `7`)

## Project Structure

- `7/index.html` — Main HTML page with full SEO optimization (meta tags, OG, JSON-LD, 500+ word content section)
- `7/app.js` — Security analysis logic (regex-based pattern scanning)
- `7/styles.css` — Responsive three-panel layout and styling
- `7/fonts/zc-regular.ttf` — Custom Zc font

## SEO / Marketing

- Target keyword: "Prompt Security Scanner"
- H1 contains primary keyword
- Meta description, OG tags, Twitter cards, JSON-LD structured data
- 400-600 word SEO content section below the tool
- Internal linking to svivva.com throughout
- Canonical URL: https://svivva.com/tools/prompt-security-scanner

## Running the App

The workflow serves the `7/` directory on port 5000:
```
npx serve 7 -l 5000 --no-clipboard
```
