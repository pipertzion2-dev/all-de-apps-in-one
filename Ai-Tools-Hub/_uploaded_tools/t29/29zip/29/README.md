# Mini App #29: AI Melody Interpolator

Single-step preview of a Svivva workflow: user submits a brief and gets a production-style preview (schematic, audio idea, flow graph, idea report, etc.) without login.

## Run locally

Open `index.html` in a browser, or serve the folder with any static server:

```bash
npx serve .
# or: python3 -m http.server 8080
```

## Font (zc regular)

The UI uses **zc regular** across the entire site. To enable it:

1. Add `fonts/zc-regular.woff2` and/or `fonts/zc-regular.woff` in the `fonts/` folder.
2. If your font files use different names, update the `@font-face` in `styles.css`.

Until then, the stack falls back to system UI fonts.

## Analytics

The app calls `track(event, data)` for:

- **preview_generated** – when a preview is shown (mode, confidence)
- **cta_click** – primary or secondary CTA (cta, destination)
- **module_interest** – selected mode (hardware, play, idea, team, marketplace, build)

Wire this to your analytics by defining `window.analytics.track` and/or `window.gtag`.

## Backend

Generation is currently simulated (~600 ms) to keep end-to-end under 3 seconds. To plug in a real Svivva pipeline step, replace the `generatePreview()` implementation in `app.js` with your API call and map the response to `showPreview()`.
