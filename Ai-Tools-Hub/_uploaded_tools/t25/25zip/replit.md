# Product Build Flow Simulator (Mini App #25)

A free, no-login web tool that previews one step of Svivva's pipeline. Users enter a project description and select a category to get a production-style preview artifact. Optimized for Google Search with structured data, FAQ schema, and internal linking to svivva.com.

## Tech Stack
- Static HTML/CSS/JS (no build step)
- Vanilla JavaScript (ES6+)
- Custom "zc" font (local TTF file)

## Project Structure
- `25/index.html` - Main page with three-panel layout, SEO content, FAQ, structured data
- `25/app.js` - Application logic, form handling, mock pipeline generation
- `25/styles.css` - Dark theme styling with purple accent (#7C3AED)
- `25/zc-regular.ttf` - Custom font file

## SEO
- JSON-LD structured data (WebApplication + FAQPage schemas)
- Open Graph and Twitter Card meta tags
- Canonical URL pointing to svivva.com/tools/product-build-flow-simulator
- 400-600 word SEO content section
- Internal linking to svivva.com modules
- 5 FAQ items with schema markup

## Deployment
- Static deployment from `25/` directory
- Served via Python HTTP server on port 5000 in development

## Running
```
python3 -m http.server 5000 --directory 25
```
