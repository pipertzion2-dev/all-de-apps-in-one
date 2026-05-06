# Mini App #19: Material Sourcing Matcher

Single-step preview of Svivva’s material sourcing / concept matching. No login. Target runtime under 3 seconds.

## Run locally

- **Option A:** Open `index.html` in a browser (no server needed).
- **Option B:** From this folder run: `npx serve .` then open the URL shown (e.g. http://localhost:3000).

## Global UI

- **Font:** Entire site uses `zc regular` via `--font-zc` in `styles.css`. Outfit is the fallback; to use your own zc font, add `@font-face` and set `--font-zc: 'Your ZC Regular', sans-serif;`
- **Layout:** Three-panel (left: inputs, center: preview, right: feature mapping + FAQ). Accent: `#7C3AED`. Sticky bottom CTA bar.

## Analytics

The app fires these events (to `gtag` and/or `analytics.track` if present):

- `preview_generated` — mode, has_budget, has_constraints
- `cta_click` — location: below_preview_primary | below_preview_secondary | sticky_bar
- `module_interest` — module: hardware | play | idea | team | marketplace | build

Include your analytics snippet (e.g. gtag) in `index.html` to capture them.

## Backend / shell reuse

Generation is currently client-side (~800 ms) so the tool works without a server. To plug into your existing “shell, authentication-free gateway and backend adapter,” replace the `setTimeout(..., 800)` block in `app.js` with a call to your API; keep the same form payload and return shape `{ html, confidence, config }` for the preview and right-panel mapping.

## SEO

- H1: “Material Sourcing Matcher”
- Intro paragraph, tool UI, FAQ (3 questions), internal link to main Svivva module page.
