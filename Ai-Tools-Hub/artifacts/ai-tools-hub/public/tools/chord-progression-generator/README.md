# Mini App #27: Svivva Play Chord Generator Tool

Single-step chord preview from a brief. No login. Three-panel layout, zc font, one primary CTA to Svivva.

## Run locally

```bash
# From this directory
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:3000` (serve) or `http://localhost:8080` (python).

## Font (zc regular)

Global UI uses `font-family: 'zc', 'DM Sans', system-ui`. To use the real **zc regular** font:

1. Add `zc-regular.woff2` and/or `zc-regular.woff` into the `fonts/` folder.
2. The existing `@font-face` in `styles.css` will pick them up; no code change needed.

Without those files, the site uses **DM Sans** (loaded from Google Fonts) as fallback.

## Analytics

The app fires these events (to `window.analytics` and `window.gtag` if present, plus `console.log`):

- **preview_generated** — when a preview is shown (mode, chord_count, confidence)
- **cta_click** — when any CTA is clicked (target, href)
- **module_interest** — selected mode when generating (module: hardware | play | idea | team | marketplace | build)

Wire your analytics SDK to listen for these or replace the `track()` implementation in `app.js`.

## SEO

- H1: Svivva Play Chord Generator Tool
- Intro paragraph + tool + FAQ (3 questions) + internal link to Svivva Play module

## Target

End-to-end preview in under ~1s (client-side generation); no backend required for the demo.
