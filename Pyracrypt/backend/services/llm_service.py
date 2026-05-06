from __future__ import annotations

import json
import os
from typing import Any

import httpx

DEFAULT_OPENAI_URL = "https://api.openai.com/v1/chat/completions"


def _env(name: str, default: str | None = None) -> str | None:
    v = os.getenv(name)
    return v if v else default


async def llm_json_completion(system: str, user: str) -> dict[str, Any]:
    """
    Returns parsed JSON from an LLM. Supports OpenAI-compatible APIs and Ollama.
    """
    api_key = _env("OPENAI_API_KEY") or _env("LLM_API_KEY")
    base_url = (_env("LLM_BASE_URL") or "").rstrip("/")
    model = _env("LLM_MODEL") or _env("OPENAI_MODEL") or "gpt-4o-mini"
    ollama_host = _env("OLLAMA_HOST", "http://127.0.0.1:11434")
    ollama_model = _env("OLLAMA_MODEL", "llama3.2")

    if api_key:
        url = f"{base_url}/chat/completions" if base_url else DEFAULT_OPENAI_URL
        payload = {
            "model": model,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }
        headers = {"Authorization": f"Bearer {api_key}"}
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(url, json=payload, headers=headers)
            r.raise_for_status()
            data = r.json()
        content = data["choices"][0]["message"]["content"]
        return json.loads(content)

    # Ollama (local, no API key)
    async with httpx.AsyncClient(timeout=180.0) as client:
        r = await client.post(
            f"{ollama_host.rstrip('/')}/api/chat",
            json={
                "model": ollama_model,
                "stream": False,
                "format": "json",
                "messages": [
                    {"role": "system", "content": system + "\nRespond with JSON only."},
                    {"role": "user", "content": user},
                ],
            },
        )
        if r.status_code == 200:
            data = r.json()
            content = data.get("message", {}).get("content", "{}")
            return json.loads(content)

    raise RuntimeError(
        "No LLM configured. Set OPENAI_API_KEY (or LLM_API_KEY + optional LLM_BASE_URL), "
        "or start Ollama on OLLAMA_HOST with OLLAMA_MODEL installed."
    )


def llm_configured() -> bool:
    return bool(_env("OPENAI_API_KEY") or _env("LLM_API_KEY"))
