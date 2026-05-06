# Integration Plan Into Existing Pyracrypt

This maps the add-on features to your existing project components.

## Existing Targets Found

- Frontend app: `Pyracrypt/artifacts/cybersec-app/src`
- Frontend entry: `Pyracrypt/artifacts/cybersec-app/src/App.jsx`
- Existing pages: `Pyracrypt/artifacts/cybersec-app/src/pages`
- API client: `Pyracrypt/artifacts/cybersec-app/src/api/client.js`
- Backend API routes: `Pyracrypt/backend/routes`
- Backend services/agents: `Pyracrypt/backend/services` and `Pyracrypt/backend/agents`

## Add-On Migration Map

1. Threat Guard Assistant
   - Frontend page: add `ThreatGuardPage.jsx` under `src/pages`
   - API endpoint: add `/threat/analyze` route under `backend/routes`
   - Logic service: add `threat_guard.py` under `backend/services`

2. Intrusion Prevention Board
   - Frontend page or dashboard widget in `src/pages/DashboardPage.jsx`
   - Backend persistence route `/controls/*` under `backend/routes`
   - Store checklist state in your existing DB/session layer

3. Incident Playbooks
   - Frontend page `IncidentPlaybooksPage.jsx` under `src/pages`
   - Backend route `/playbooks` under `backend/routes`
   - Reuse remediation concepts from `backend/routes/remedy.py`

4. Marketing Funnel AI
   - Frontend page `FunnelAIPage.jsx` under `src/pages`
   - Backend route `/pipeline/leads` under `backend/routes/pipeline.py` or separate leads route
   - Reuse pipeline concepts from `backend/services/pipeline_engine.py`

5. Combined Navigation
   - Register routes in `src/App.jsx`
   - Link from `src/pages/GrowthLaunchpad.jsx` to funnel + security conversion steps

## Immediate Merge Sequence

1. Copy logic from this add-on `app.js` into modular frontend components.
2. Convert localStorage state into backend persistence + authenticated APIs.
3. Add one shared design token file for consistent UI between current app and add-on.
4. Add analytics events for conversion and incident lifecycle milestones.
5. Smoke test: assistant -> prevention checklist -> playbook -> lead capture -> export report.

## Suggested Priority

- P1: Threat assistant + prevention checklist + route wiring
- P2: Incident playbooks + backend persistence
- P3: Funnel AI + campaign attribution + conversion automation

