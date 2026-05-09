# Workspace

## Overview

pnpm workspace monorepo with a **Cybersecurity Wavy** app: React + Three.js frontend with a Python FastAPI backend.

## Artifacts

### cybersec-app (previewPath `/`, port via $PORT)

- React 19 + Vite 7 frontend
- Three.js 3D scene via `@react-three/fiber@9.5.0` + `@react-three/drei@10.7.7`
- Zustand state management
- Tailwind v4 (via `@tailwindcss/vite`, no config file needed)
- Source: `artifacts/cybersec-app/src/`
  - `App.jsx` — main layout + panel routing
  - `components/SecurityScene.jsx` — Three.js 3D canvas with WebGL fallback
  - `store/usePipelineStore.js` — Zustand pipeline state
  - `react-compat.js` — React 19 polyfill for older lib internals
- Vite proxy: all `/hypothesis`, `/combine`, `/mutate`, `/simulate`, `/remedy`, `/pipeline`, `/suite`, `/features` → FastAPI on port 8000

### Python Backend (port 8000)

- FastAPI + uvicorn
- Source: `backend/`
  - `main.py` — app entry, CORS, route mounting
  - `services/llm_service.py` — OpenAI-compatible + Ollama fallback
  - `routes/` — hypothesis, combine, mutate, simulate, remedy, pipeline, suite, features
- No API key required; app falls back to static/mock logic if LLM is unavailable

## Key Notes

- **React 19 + R3F**: Cleared stale Vite pre-bundle cache fixed `ReactCurrentOwner` error. `react-compat.js` polyfill also patches internals for older libs.
- **WebGL**: `SecurityScene` detects WebGL availability before mounting Canvas; shows graceful fallback message in headless/no-GPU environments.
- **Font**: `DecimaMonoPro-Regular.ttf` in `artifacts/cybersec-app/public/fonts/`

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **Frontend**: React 19, Vite 7, Three.js, @react-three/fiber v9, Zustand
- **Backend**: Python 3.11, FastAPI, uvicorn, httpx, pydantic

## Key Commands

- `pnpm --filter @workspace/cybersec-app run dev` — run frontend
- `cd backend && python -m uvicorn main:app --reload` — run backend

See the `pnpm-workspace` skill for workspace structure details.
