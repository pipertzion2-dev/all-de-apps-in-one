# Audio Export & MIDI Mapper — Preview Tool

Single-step preview of Svivva’s export & MIDI mapping pipeline. No login. Target: organic traffic for hardware builders, music creators, product teams, and founders.

## Quick start

- Open `index.html` in a browser or serve the folder (e.g. `npx serve .`).
- Fill **Short description** (required), choose **Mode**, add optional constraints, then **Generate preview**.
- Preview appears in the center (waveform + MIDI table); right panel explains the Svivva step and full workflow.

## UI rules

- **Font:** ZC Regular across the entire site (fallback: Outfit). To use your ZC Regular webfont, add the `@font-face` block noted in `styles.css`.
- **Layout:** Three-panel (left: inputs, center: preview, right: feature mapping). Accent: `#9333EA`.
- **CTA:** Sticky bottom bar + primary CTA below preview; one primary CTA to Svivva.

## Analytics

The app calls `track(event, data)` for:

- **preview generated** — with `mode`, `confidence`, `has_constraints`
- **module interest** — with `module` (hardware / play / idea / team / marketplace / build)
- **CTA click** — with `label`, `url`

Wire these to your analytics by defining `window.gtag` and/or `window.analytics` before `app.js` runs, or replace the `track()` implementation in `app.js` with your backend/GA4/etc.

## Backend adapter

Generation is currently simulated in `runExportAndMidiMapStep()` in `app.js` to keep runtime under 3 seconds without a server. To plug in the real Svivva pipeline:

1. Replace the body of `runExportAndMidiMapStep()` with a `fetch()` (or your gateway) to your auth-free backend.
2. Have the backend return `{ waveformBars, midiRows, confidence, readiness, bars, mode, explanation }` (or adapt `showPreview()` to your response shape).

## SEO

- **H1:** Audio Export & MIDI Mapper
- Intro paragraph, tool UI, FAQ (3 questions), internal link to main Svivva module page.

## Target keywords

- audio export & midi mapper tool
- audio export & midi mapper online
- free audio export & midi mapper
- ai audio export & midi mapper
