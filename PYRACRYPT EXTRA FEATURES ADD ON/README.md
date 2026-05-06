# PyraCrypt Extra Features Add-On

This package is a standalone add-on you can run now, then merge into your full PyraCrypt + marketing funnel setup.

It is designed around your screenshot context:
- explain AI vs AGI clearly,
- focus on protecting against known/current threats,
- provide practical prevention actions and incident workflows,
- connect security actions to a marketing/conversion funnel.

## What Is Included

- `index.html` - full UI shell (single-page app)
- `styles.css` - dark cyber UI styling
- `app.js` - all feature logic

## Features

- Threat Guard Assistant
  - Rule-based security assistant for known threat patterns
  - AI vs AGI education panel for realistic capability framing
  - Suggested prevention actions per scenario
- Intrusion Prevention Board
  - Endpoint hardening controls
  - IDS/IPS and baseline monitoring checklist
  - Credential and patch defense controls
- Incident Playbooks
  - Phishing, ransomware, credential stuffing workflows
  - Step-by-step response actions and evidence prompts
- Marketing Funnel AI
  - Lead capture and qualification
  - Funnel stages: Awareness -> Evaluation -> Trial -> Conversion -> Retention
  - Export/import pipeline state as JSON
- App Merge Planner
  - Track source apps and integration status
  - Notes for where each module should live in your master app

## Run

Option A (quick): open `index.html` directly in your browser.

Option B (recommended local server):

```bash
python3 -m http.server 4173
```

Then visit:

[http://localhost:4173](http://localhost:4173)

## Merge Into Your Main Combined App

Use this add-on as a feature module inside your larger app:

1. Move `index.html` sections into your existing route/page system.
2. Move `styles.css` into your global style pipeline or CSS modules.
3. Convert `app.js` logic into:
   - frontend store/actions (for UI state),
   - backend endpoints (for persistence, auth, and analytics),
   - marketing automation hooks (email, CRM, notifications).
4. Persist leads/checklists/playbooks in your production DB.
5. Protect with your auth roles (admin, analyst, sales, founder).

## Recommended Next Upgrade

- Replace rule-based assistant with your LLM endpoint
- Add endpoint telemetry ingestion (EDR, auth logs, SIEM)
- Add campaign attribution fields to funnel leads
- Add Stripe/subscription conversion event hooks

