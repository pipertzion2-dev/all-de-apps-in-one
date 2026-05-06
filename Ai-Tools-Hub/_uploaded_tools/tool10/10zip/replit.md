# Free Prompt Consistency Checker

## Overview
A web tool that analyzes and scores the consistency of AI prompts, schemas, or API definitions. Provides instant analysis on terminology, structure, clarity, and schema alignment. Optimized for Google search as an engineering-as-marketing tool for Svivva.

## Tech Stack
- **Backend**: Node.js + Express
- **Frontend**: Vanilla HTML/CSS/JS
- **Port**: 5000

## Project Structure
```
10/
├── server.js          # Express server with /api/analyze, /robots.txt, /sitemap.xml
├── package.json       # Project dependencies (express, cors)
└── public/
    ├── index.html     # SEO-optimized page with H1, structured data, OG tags, 400+ word content
    ├── app.js         # Frontend logic for analysis requests
    ├── styles.css     # Custom styling with accent color #B45309
    └── fonts/
        └── Zc-Regular.ttf  # Custom font
```

## How to Run
- Workflow "Start application" runs `cd 10 && node server.js` on port 5000
- Deployment: autoscale target with `bash -c "cd 10 && node server.js"`

## API
- `POST /api/analyze` - Accepts `{ prompt, schema?, model? }` and returns consistency scores, issues, and suggestions
- `GET /robots.txt` - SEO robots file
- `GET /sitemap.xml` - SEO sitemap

## Pages
- `/` — Tool page (the actual checker UI)
- `/lp` — Marketing landing page (conversion-focused, follows Google-first playbook)

## SEO Features
- H1: "Free Prompt Consistency Checker"
- Meta description, keywords, canonical URL
- Open Graph and Twitter Card meta tags
- JSON-LD structured data (WebApplication schema)
- 400+ word SEO content article below the tool
- Internal linking to svivva.com
- CTA bar linking to Svivva
- robots.txt and sitemap.xml
