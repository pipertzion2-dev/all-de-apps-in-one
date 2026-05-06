# Mini App #17: Hardware Concept to Schematic Previewer

Single-step preview of Svivva’s hardware pipeline: concept → schematic/BOM preview. No login required.

## Run locally

```bash
# From this folder, serve the app (e.g. with Python 3)
python3 -m http.server 8080
# Open http://localhost:8080
```

Or open `index.html` directly in a browser.

## Font

- **zc regular**: Place `zc-regular.woff2` (or `zc-regular.woff`) in this folder to use the brand font. The app falls back to JetBrains Mono until then.

## Analytics

The app logs these events (and forwards to `window.analytics` / `window.gtag` if present):

- `preview_generated` — mode, confidence, has_constraints
- `cta_click` — source (cta-primary, cta-secondary, sticky-cta)
- `module_interest` — module (hardware, play, idea, team, marketplace, build)

## Backend

Currently runs fully client-side for &lt;3s preview. To plug in your existing gateway/backend adapter, replace the `generatePreview()` logic in `app.js` with a call to your API and render the returned artifact in `artifactEl`.
