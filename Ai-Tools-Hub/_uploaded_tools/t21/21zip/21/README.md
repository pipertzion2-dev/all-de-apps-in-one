# Mini App #21: 3D Model From Text Preview Tool

Single-step preview of a Svivva workflow: users enter a brief and get a production-style preview in under 3 seconds—no account required.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Analytics

The app logs these events (and forwards to `gtag` when present):

- **preview generated** – `mode`: hardware | play | idea | team | marketplace | build
- **CTA click** – `type`: primary | secondary
- **module interest** – `module`: selected mode when user changes the dropdown

To enable Google Analytics, add your gtag script in `index.html` before the closing `</head>` tag.

## Font

Uses **zc regular** from `/public/fonts/Zc-Regular.ttf` (copied from App 2). Entire UI uses this font.

## Structure

- **Left panel**: Short description (required), mode selector, optional constraints (budget, genre, materials, region, collaboration size).
- **Center panel**: Preview artifact (3D placeholder, schematic, audio, flow, or report), confidence/readiness bar, summary, secondary CTA.
- **Right panel**: Which Svivva step is being previewed and what the full workflow adds; link to module page.
- **Sticky CTA bar**: Primary CTA to try Svivva free.

Preview is simulated in ~1–1.4s to keep end-to-end under 3 seconds. Replace `src/preview.ts` with a real backend adapter to hit your pipeline.
