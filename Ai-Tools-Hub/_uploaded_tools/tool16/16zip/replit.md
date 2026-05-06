# JSON Schema Linter — by Svivva

A free web tool that analyzes JSON Schemas, OpenAPI definitions, or prompt configurations and provides a tightness score (0-100) with recommendations. Built as an engineering-as-marketing asset to drive traffic to svivva.com.

## Tech Stack
- **Backend**: Python / Flask (dev), Gunicorn (production)
- **Frontend**: Vanilla HTML/CSS/JS (single-page app)
- **Font**: Custom font (Zc-Regular.ttf)

## Project Structure
- `16/server.py` - Flask server (entry point, runs on port 5000)
- `16/index.html` - Frontend UI with all SEO content
- `16/fonts/Zc-Regular.ttf` - Custom font

## Running (Development)
```
python 16/server.py
```
Server starts on `0.0.0.0:5000`.

## Production Deployment
Uses Gunicorn via autoscale deployment:
```
gunicorn --bind=0.0.0.0:5000 --reuse-port --chdir 16 server:app
```

## SEO / Engineering-as-Marketing Setup
- **Page title**: "JSON Schema Linter — Free API Schema Tightness Checker | Svivva"
- **H1**: "JSON Schema Linter & Tightness Scorer"
- **Meta description**: Targets "json schema linter", "openapi linter" keywords
- **Canonical URL**: https://schema-linter.svivva.com (point subdomain here after deployment)
- **Structured data**: JSON-LD SoftwareApplication schema
- **Open Graph + Twitter Card**: Full social sharing tags
- **Body content**: ~550 words covering schema tightness, how the tool works, why it matters for APIs and AI, and CTA to Svivva
- **Internal/cross-domain links**: Multiple links to svivva.com in header nav, content body, guidance panel, and sticky footer

## Recommended Next Steps
- Point `schema-linter.svivva.com` as a subdomain to the deployed Replit URL for maximum domain authority benefit
- Submit the URL to Google Search Console after deployment
- Add a blog post on svivva.com that links back to this tool (reverse internal link)
