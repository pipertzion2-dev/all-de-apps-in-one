# V-1 Standard Style: AWS-ready and Next.js-friendly

This keeps your app structure intact and adds deployment scaffolding.

## Local (Docker Compose)

- Build and run all services (frontend, backend, proxy):

  ```bash
  docker compose up --build
  ```

- Open: `http://localhost` (Nginx proxy). Backend is routed at `/api`.

## AWS ECS (Fargate) or EC2

- Build and push images:

  ```bash
  # Backend
  docker build -t v1-standard-backend:latest ./VAPP/backend
  # Frontend
  docker build -t v1-standard-frontend:latest -f ./VAPP/frontend/Dockerfile.production ./VAPP/frontend
  ```

- Tag and push to ECR, then create an ECS service with:
  - Task with 3 containers: proxy (port 80), frontend (8501), backend (8007)
  - ALB target group forwards `/:80` to proxy

- Environment variables:
  - Backend: `AI_PROVIDER`, `AI_MODEL`, `OLLAMA_HOST`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `APP_VERSION=v1`, `STYLE_SLUG=standard`
  - Frontend: `API_URL=/api`

- Health checks:
  - Backend: `/healthz`
  - Frontend: `/` (Streamlit)

## Next.js Migration (frontend)

- Keep the proxy routing the same (`/` → frontend, `/api` → backend).
- When you swap Streamlit for Next.js:
  - Replace `frontend/Dockerfile.production` with a Node-based Dockerfile (notes included at bottom of that file)
  - Make sure the app fetches APIs from `/api` (or set `API_URL` env)

## Single-app unification

- The included Nginx proxy exposes a single host with unified routes:
  - `GET /` → frontend UI
  - `POST /api/*` → FastAPI backend
- This mirrors how a unified V-1 app would look (Standard Style) without changing your current code.

## Notes

- For local Ollama in Docker, use `OLLAMA_HOST=http://host.docker.internal:11434`.
- To use OpenAI instead of Ollama, set `AI_PROVIDER=openai` and provide `OPENAI_API_KEY`.


