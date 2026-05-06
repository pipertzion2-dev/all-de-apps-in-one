# Schema Field Impact Analyzer

Free, single-purpose web tool for analyzing which schema fields have the highest impact on prompts and API behavior. No login required.

**Target keywords:** schema field impact analyzer tool, schema field impact analyzer online, schema field impact analyzer free

## Run locally

```bash
npm install
npm start
```

Open [http://localhost:3012](http://localhost:3012). Paste a JSON schema or API definition (with `properties`), optionally add a prompt for context, and click **Analyze impact**. Results appear in under 3 seconds.

## Stack

- **Frontend:** HTML, CSS, JS — three-panel layout, zc font, accent `#9333EA`, sticky Svivva CTA
- **Backend:** Node + Express, in-memory analyzer (no DB)

## Font

The UI uses **zc regular**. A copy of `Zc-Regular.ttf` is in `public/fonts/`. Original source: `Zc - Regular.ttf` from your Downloads.

## CTA

Sticky bottom bar links to [Svivva](https://svivva.com) with copy: *"You just tested one prompt. In Svivva you can turn this into a production-ready API with automated tests, versioning, monitoring, and cost optimization. Try Svivva for free."*
