# Free Supplier Comparison Tool

A standalone web tool (engineering-as-marketing) that previews one step of the Svivva platform's workflow — supplier comparison. Users enter a project brief and get an instant, simulated side-by-side comparison of suppliers. All links drive traffic to svivva.com.

## Tech Stack
- **Backend**: Node.js (built-in `http` module, no external dependencies)
- **Frontend**: Vanilla HTML/CSS/JS
- **Font**: Custom `Zc-Regular.ttf`

## Project Structure
All source files live in the `24/` directory:
- `24/server.js` — Node.js server (static files + `/api/preview` endpoint)
- `24/index.html` — Main HTML page (three-panel layout, SEO-optimized)
- `24/styles.css` — Styling with CSS variables
- `24/app.js` — Client-side logic (comparison generation runs client-side)
- `24/fonts/Zc-Regular.ttf` — Custom font
- `24/robots.txt` — Search engine crawling rules
- `24/sitemap.xml` — XML sitemap for search engines
- `24/package.json` — Project metadata

## SEO
- Title: "Free Supplier Comparison Tool — Compare Suppliers Online | Svivva"
- H1 keyword: "Free Supplier Comparison Tool"
- 400-600 word intro content with keyword targeting
- JSON-LD structured data (WebApplication + FAQPage)
- Open Graph and Twitter Card meta tags
- Canonical URL points to svivva.com/tools/supplier-comparison
- Internal links throughout to svivva.com
- robots.txt and sitemap.xml included

## Running
The workflow runs `cd 24 && PORT=5000 node server.js` to start the server on port 5000.

## Deployment
Configured for autoscale deployment: `cd 24 && PORT=5000 node server.js`

## API
- `POST /api/preview` — Accepts `{description, mode, constraints}` and returns supplier comparison data with readiness score.
