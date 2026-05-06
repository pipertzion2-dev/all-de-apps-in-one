# Mini App #28: Svivva Play Patch Designer

Single-step preview of a Svivva workflow: user submits a brief and mode, gets a production-style preview with no login.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
# or
python3 -m http.server 8080
```

## Features

- **Three-panel layout**: Left = inputs, Center = preview + primary CTA, Right = feature mapping.
- **Global font**: zc regular (CSS variable `--font-zc`); fallback DM Sans. Add your `@font-face` in `styles.css` if you have the font file.
- **No login**: Fully anonymous; one primary CTA to Svivva (sticky bar + below preview).
- **Modes**: hardware, play, idea, team, marketplace, build.
- **Output**: Generated preview (BOM table, flow, idea report, or setup map), readiness %, and mapping copy.
- **Runtime**: Simulated generation ~1.2s (target &lt;3s).

## Analytics

The app emits events you can hook to your analytics:

- `preview_generated` — when a preview is shown (mode, confidence).
- `cta_click` — when any CTA is clicked (label: primary_below_preview, secondary_open_in_svivva, sticky_bar).
- `module_interest` — selected mode when generating (module: hardware | play | idea | team | marketplace | build).

Wire by defining `window.analytics.track(name, data)` and/or `window.gtag('event', name, data)` before loading `app.js`.

## SEO

- H1: Svivva Play Patch Designer
- Intro paragraph + tool + FAQ (3 questions) + internal link to main Svivva module.

## Links

- Primary CTA: [svivva.com](https://svivva.com)
- Secondary: open in real project (e.g. svivva.com/projects)
- FAQ internal link: main Svivva module
