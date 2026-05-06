# CyberWavy Free Tools Hub

A collection of 40+ free cybersecurity tools designed to drive Google Search traffic and funnel users to Pyracrypt.

## Architecture

- **Framework**: React 18 + TypeScript + Vite
- **Routing**: React Router v6 (SPA)
- **Styling**: Custom CSS with Rothco army color themes (dark olive/khaki palette)
- **AI Tips**: Optional OpenAI integration via `/api/ai-insight` endpoint

## Project Structure

```
cyberwavy-hub/
├── src/
│   ├── App.tsx              # Router config
│   ├── main.tsx             # Entry point
│   ├── index.css            # Global Rothco army dark theme
│   ├── components/
│   │   ├── NavBar.tsx       # Site nav with Pyracrypt CTA button
│   │   ├── CyberWavyCTA.tsx # Pyracrypt promotional block
│   │   ├── ThemedShell.tsx  # Per-tool Rothco theme wrapper
│   │   ├── AiInsightPanel.tsx
│   │   └── Spinner.tsx
│   ├── pages/
│   │   ├── Hub.tsx          # Main listing page (tool grid + landing grid)
│   │   ├── ToolPage.tsx     # Individual tool page (/tool/:slug)
│   │   └── LandingPage.tsx  # SEO landing pages (/lp/:slug)
│   ├── tools/
│   │   └── ToolBodies.tsx   # All 40 mini-app implementations
│   ├── data/
│   │   └── toolsRegistry.ts # Tool + landing definitions, Rothco themes
│   └── lib/
│       ├── dns.ts           # DNS-over-HTTPS queries
│       ├── hash.ts          # SHA-256 helper
│       └── localAiInsights.ts # Rule-based tips fallback
├── server/
│   └── aiInsight.mjs        # OpenAI proxy endpoint
├── public/
│   └── pyracrypt-logo.png   # Pyracrypt logo for CTAs
├── vite.config.ts           # Dev server on port 5000
└── server.mjs               # Express production server
```

## Routes

- `/` — Hub page (all tools + landing pages listed)
- `/tool/:slug` — Individual mini-app (40 tools)
- `/lp/:slug` — SEO landing pages (funnels to Pyracrypt)

## Running

```
cd cyberwavy-hub && node_modules/.bin/vite --port 5000
```

## Design System

- **Palette**: Rothco army dark (olive drab, khaki, gunmetal, woodland)
- **Background**: Dark charcoal (`#1a1d13`) with subtle camo pattern overlay
- **Cards**: Semi-transparent dark glass with olive borders
- **Typography**: ZC4 / ZC Regular custom fonts (military stencil feel)
- **CTA**: Pyracrypt logo prominent in every CTA block

## Pyracrypt Integration

All CTAs point to `https://pyracrypt.replit.app`. The site is purely a free-tools funnel — no Pyracrypt branding on the hub itself.
