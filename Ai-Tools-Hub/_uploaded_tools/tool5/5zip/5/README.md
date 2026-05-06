# AI Test Case Explorer

Free, single-purpose web tool for **AI test case explorer** — target keywords: *ai test case explorer tool*, *ai test case explorer online*, *ai test case explorer free*.

- **No login**, fast load, three-panel layout, accent `#1D4ED8`
- **Font:** ZC Regular (add your font file and `@font-face` in `styles.css` if you have it; fallback is DM Sans)
- **Primary CTA:** Links to Svivva Mini App #15: AI Test Case Explorer — set the URL in `app.js` (`CTA_URL`)

## Run locally

**Static (no server):**  
Open `index.html` in a browser. Analysis runs client-side; results appear in under 3 seconds.

**With backend (swap analysis in `server.js`):**
```bash
npm start
```
Then open `http://localhost:8080`. Backend exposes `POST /analyze`; change only `runAnalysis()` in `server.js` to swap logic and keep runtime under 3s.

## CTA

Sticky bottom bar copy:

> You just tested one prompt. In Svivva you can turn this into a production-ready API with automated tests, versioning, monitoring, and cost optimization. Try Svivva for free.

Button: **Try Svivva for free** → set `ctaLink.href` in `app.js` to your Svivva / Mini App #15 URL.

## Deploy / host server showing old app

- **Bump asset version** after each deploy: in `index.html` change `?v=2` to `?v=3` (then `v=4`, etc.) on both `styles.css` and `app.js` so browsers fetch new CSS/JS.
- **Disable CDN/host cache** for this app if possible (e.g. “no cache” for `index.html` and short TTL for static assets).
- **Hard refresh** after deploy: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac).
- When using `server.js`, the server sends `Cache-Control: no-store` for the HTML and `max-age=0, must-revalidate` for CSS/JS so new deploys are picked up after refresh.
