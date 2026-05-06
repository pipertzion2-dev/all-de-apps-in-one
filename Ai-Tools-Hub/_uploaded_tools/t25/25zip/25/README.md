# Mini App #25: Physical BUILD Flow Simulator

Free, no-login preview of one step of Svivva’s pipeline. Target: organic traffic for hardware builders, music creators, product teams, and founders.

## Run locally

```bash
cd "/Users/Zion/Documents/40 Cursor Apps/25"
npx serve .
# or: python3 -m http.server 8080
```

Open `http://localhost:3000` (or 8080). No build step required.

## Structure

- **Left panel** – Short description (required), mode (hardware / play / idea / team / marketplace / build), optional constraints (budget, genre, materials, region, collaboration size).
- **Center panel** – Generated preview (schematic, BOM, waveform, idea report, setup map, or flow text), readiness %, and short explanation; primary/secondary CTAs below.
- **Right panel** – Which Svivva step is previewed and upgrade nudge.
- **Sticky bar** – Single primary CTA to Svivva at all times.

## Analytics (placeholders)

The app calls `track(event, data)` for:

- `preview generated` – `{ mode, elapsed }`
- `module interest` – `{ module }` (hardware, play, idea, team, marketplace, build)
- `CTA click` – `{ cta: 'primary' | 'secondary' | 'sticky_bar' }`

Wire to your analytics (e.g. `window.analytics`, `window.gtag`) in `app.js`.

## SEO

- H1: Physical BUILD Flow Simulator
- Intro paragraph, tool UI, FAQ (3 questions), internal link to Svivva B.U.I.L.D. module.

## Font

Global font is set via `--font-zc` (default: Outfit). To use a real “zc” webfont, add `@font-face` in `styles.css` and set `--font-zc: 'zc', sans-serif`.
