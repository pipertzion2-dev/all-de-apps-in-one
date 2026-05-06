from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import httpx


def _mask(val: Optional[str], keep: int = 4) -> str:
    if not val:
        return ""
    if len(val) <= keep * 2:
        return "***"
    return val[:2] + "…" + val[-keep:]


def _env(name: str) -> Optional[str]:
    v = os.getenv(name)
    return v if v and str(v).strip() else None


def bootstrap_payload() -> Dict[str, Any]:
    admin_set = bool(_env("ADMIN_SECRET"))
    return {
        "app": "Cybersecurity Wavy",
        "admin_secret_configured": admin_set,
        "message": (
            "Administrator: open this page only when configuring the deployment. "
            "End users never see this URL unless they guess /admin."
        ),
        "replit": {
            "recommended_run": "npm install && npm run dev",
            "root_directory": "Repository root (contains package.json + frontend/ + backend/).",
            "secrets_tab": "Replit → Tools → Secrets (or Project Secrets). Add each key below.",
        },
        "first_time_steps": [
            "Create a strong ADMIN_SECRET in Replit Secrets, then reload this page.",
            "Add OPENAI_API_KEY (or run Ollama) for richer LLM output; otherwise fallbacks still work.",
            "Optional: set VITE_ADMIN_SECRET in Replit **Build** env if you want a separate client hint (not required).",
        ],
    }


async def ollama_status() -> Dict[str, Any]:
    host = (_env("OLLAMA_HOST") or "http://127.0.0.1:11434").rstrip("/")
    try:
        async with httpx.AsyncClient(timeout=2.5) as c:
            r = await c.get(f"{host}/api/version")
            return {"host": host, "reachable": r.status_code == 200, "http_status": r.status_code}
    except Exception as exc:  # noqa: BLE001
        return {"host": host, "reachable": False, "error": str(exc)[:240]}


def integrations_matrix() -> List[Dict[str, Any]]:
    """Roadmap + env wiring for power features (admin-only visibility)."""
    return [
        {
            "id": "openai",
            "name": "OpenAI-compatible LLM",
            "status": "available",
            "env": ["OPENAI_API_KEY or LLM_API_KEY", "LLM_BASE_URL (optional)", "LLM_MODEL or OPENAI_MODEL"],
            "notes": "Primary path for JSON agents; set LLM_BASE_URL for OpenRouter or Azure OpenAI.",
        },
        {
            "id": "ollama",
            "name": "Ollama (local / sidecar)",
            "status": "available",
            "env": ["OLLAMA_HOST", "OLLAMA_MODEL"],
            "notes": "Used when no API key is set; overview pings reachability.",
        },
        {
            "id": "slack",
            "name": "Slack / Teams incident hooks",
            "status": "planned",
            "env": ["SLACK_WEBHOOK_URL", "TEAMS_WEBHOOK_URL"],
            "notes": "Wire in a future release to POST critical suite findings.",
        },
        {
            "id": "sentry",
            "name": "Error tracking",
            "status": "planned",
            "env": ["SENTRY_DSN", "VITE_SENTRY_DSN"],
            "notes": "Frontend + backend SDK hooks.",
        },
        {
            "id": "ti_feed",
            "name": "Threat intel feeds (MISP, STIX)",
            "status": "planned",
            "env": ["MISP_URL", "MISP_API_KEY"],
            "notes": "Would enrich suite threat_intel_priorities with live data.",
        },
        {
            "id": "asm",
            "name": "Attack surface management",
            "status": "planned",
            "env": ["ASM_API_TOKEN"],
            "notes": "External asset discovery to seed system descriptions.",
        },
        {
            "id": "cspm",
            "name": "Cloud posture (AWS/Azure/GCP)",
            "status": "planned",
            "env": ["AWS_ROLE_ARN", "AZURE_TENANT_ID", "GCP_SA_JSON"],
            "notes": "Read-only scanners for misconfigs referenced in suite text.",
        },
        {
            "id": "siem",
            "name": "SIEM export",
            "status": "planned",
            "env": ["SPLUNK_HEC_URL", "SPLUNK_HEC_TOKEN"],
            "notes": "Push structured events from pipeline runs.",
        },
        {
            "id": "vault",
            "name": "Enterprise secrets (Vault / KMS)",
            "status": "planned",
            "env": ["VAULT_ADDR", "VAULT_TOKEN"],
            "notes": "Replace plain Replit secrets for regulated deployments.",
        },
        {
            "id": "auth0",
            "name": "End-user auth for the product",
            "status": "planned",
            "env": ["AUTH0_DOMAIN", "AUTH0_CLIENT_ID"],
            "notes": "Multi-tenant product login (today: single-page demo, no login).",
        },
    ]


def replit_env_template() -> str:
    return """# === Replit / production secrets (Tools → Secrets) ===
# Never commit real values. Paste into Replit Secrets UI (name = left, value = right).

ADMIN_SECRET=generate-with-openssl-rand-hex-32

# --- LLM (pick one path) ---
OPENAI_API_KEY=
# LLM_BASE_URL=https://openrouter.ai/api/v1
# LLM_MODEL=openai/gpt-4o-mini

OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2

# --- Optional tuning ---
# BACKEND_URL=http://127.0.0.1:8000
# PORT=5000

# --- Future integrations (app ignores until implemented) ---
# SLACK_WEBHOOK_URL=
# SENTRY_DSN=
# MISP_URL=
# MISP_API_KEY=
"""


async def build_overview() -> Dict[str, Any]:
    oa = bool(_env("OPENAI_API_KEY") or _env("LLM_API_KEY"))
    ollama = await ollama_status()
    return {
        "llm": {
            "openai_or_compatible_configured": oa,
            "masked_key_suffix": _mask((_env("OPENAI_API_KEY") or _env("LLM_API_KEY") or "")),
            "llm_base_url_set": bool(_env("LLM_BASE_URL")),
            "llm_model": _env("LLM_MODEL") or _env("OPENAI_MODEL") or "gpt-4o-mini",
            "ollama": ollama,
        },
        "server": {
            "python": os.getenv("PYTHON_VERSION", "unknown"),
            "uvicorn_module": "main:app",
            "cors": "allow_origins=* (tighten behind a reverse proxy in production)",
        },
        "api_surface": {
            "public_routes": [
                "/health",
                "/features",
                "/hypothesis",
                "/combine",
                "/mutate",
                "/simulate",
                "/remedy",
                "/pipeline",
                "/suite",
                "/docs",
            ],
            "admin_routes": ["/api/admin/bootstrap", "/api/admin/overview", "/api/admin/replit-env-template"],
        },
        "integrations": integrations_matrix(),
        "replit_env_template": replit_env_template(),
        "frontend_build_env": {
            "VITE_API_URL": "Leave empty on Replit so Vite proxies to FastAPI.",
            "VITE_ADMIN_SECRET": "Optional; not used for server auth. Server uses ADMIN_SECRET only.",
        },
    }
